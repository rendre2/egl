import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { watchTime } = body

    // Validation des données
    if (typeof watchTime !== 'number' || watchTime < 0) {
      return NextResponse.json(
        { error: 'Temps de visionnage invalide' },
        { status: 400 }
      )
    }

    // Vérifier que le contenu existe et est actif
    const content = await prisma.content.findUnique({
      where: { 
        id: params.id,
        isActive: true 
      },
      include: {
        chapter: {
          include: {
            module: {
              select: {
                id: true,
                order: true
              }
            }
          }
        }
      }
    })

    if (!content) {
      return NextResponse.json(
        { error: 'Contenu non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le contenu est débloqué pour cet utilisateur
    const isUnlocked = await checkContentUnlocked(session.user.id, content)
    
    if (!isUnlocked) {
      return NextResponse.json(
        { error: 'Contenu verrouillé' },
        { status: 403 }
      )
    }

    // Limiter le temps de visionnage à la durée du contenu
    const clampedWatchTime = Math.min(watchTime, content.duration)
    
    // Un contenu est complété à 100% uniquement
    const isCompleted = clampedWatchTime >= content.duration

    // Créer ou mettre à jour la progression du contenu
    const contentProgress = await prisma.contentProgress.upsert({
      where: {
        userId_contentId: {
          userId: session.user.id,
          contentId: params.id
        }
      },
      update: {
        watchTime: clampedWatchTime,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        contentId: params.id,
        watchTime: clampedWatchTime,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    })

    // Si le contenu est complété, vérifier si le chapitre est complété
    if (isCompleted) {
      await checkAndUpdateChapterProgress(session.user.id, content.chapterId)
    }

    const progressPercentage = Math.min(100, Math.round((clampedWatchTime / content.duration) * 100))

    return NextResponse.json({
      success: true,
      data: {
        watchTime: contentProgress.watchTime,
        isCompleted: contentProgress.isCompleted,
        completedAt: contentProgress.completedAt,
        progress: progressPercentage,
        contentId: params.id
      },
      message: isCompleted ? 'Contenu terminé avec succès !' : 'Progression mise à jour'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        success: false
      },
      { status: 500 }
    )
  }
}

// Fonction pour vérifier si un contenu est débloqué
async function checkContentUnlocked(userId: string, content: any): Promise<boolean> {
  // Récupérer tous les contenus du chapitre
  const chapterContents = await prisma.content.findMany({
    where: { 
      chapterId: content.chapterId,
      isActive: true 
    },
    orderBy: { order: 'asc' },
    select: { id: true, order: true }
  })

  const currentIndex = chapterContents.findIndex(c => c.id === content.id)
  
  // Le premier contenu est toujours débloqué si le chapitre est débloqué
  if (currentIndex === 0) {
    return await checkChapterUnlocked(userId, content.chapterId)
  }

  // Vérifier que le contenu précédent est complété
  const previousContent = chapterContents[currentIndex - 1]
  const previousProgress = await prisma.contentProgress.findUnique({
    where: {
      userId_contentId: {
        userId,
        contentId: previousContent.id
      }
    }
  })

  return previousProgress?.isCompleted || false
}

// Fonction pour vérifier si un chapitre est débloqué
async function checkChapterUnlocked(userId: string, chapterId: string): Promise<boolean> {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      module: {
        include: {
          chapters: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: { id: true, order: true }
          }
        }
      }
    }
  })

  if (!chapter) return false

  const chapterIndex = chapter.module.chapters.findIndex(c => c.id === chapterId)
  
  // Le premier chapitre est débloqué si le module est débloqué
  if (chapterIndex === 0) {
    return await checkModuleUnlocked(userId, chapter.moduleId)
  }

  // Vérifier que le chapitre précédent est complété
  const previousChapter = chapter.module.chapters[chapterIndex - 1]
  const previousProgress = await prisma.chapterProgress.findUnique({
    where: {
      userId_chapterId: {
        userId,
        chapterId: previousChapter.id
      }
    }
  })

  return previousProgress?.isCompleted || false
}

// Fonction pour vérifier si un module est débloqué
async function checkModuleUnlocked(userId: string, moduleId: string): Promise<boolean> {
  const modules = await prisma.module.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, order: true }
  })

  const currentIndex = modules.findIndex(m => m.id === moduleId)
  
  // Le premier module est toujours débloqué
  if (currentIndex === 0) return true

  // Vérifier que le module précédent est complété
  const previousModule = modules[currentIndex - 1]
  const previousProgress = await prisma.moduleProgress.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId: previousModule.id
      }
    }
  })

  return previousProgress?.isCompleted || false
}

// Fonction pour vérifier et mettre à jour la progression du chapitre
async function checkAndUpdateChapterProgress(userId: string, chapterId: string) {
  // Récupérer tous les contenus du chapitre
  const chapterContents = await prisma.content.findMany({
    where: { 
      chapterId,
      isActive: true 
    },
    select: { id: true }
  })

  // Vérifier si tous les contenus sont complétés
  const contentProgressList = await prisma.contentProgress.findMany({
    where: {
      userId,
      contentId: { in: chapterContents.map(c => c.id) }
    }
  })

  const allContentsCompleted = chapterContents.length > 0 && 
    chapterContents.every(content => 
      contentProgressList.some(progress => 
        progress.contentId === content.id && progress.isCompleted
      )
    )

  if (allContentsCompleted) {
    // Mettre à jour la progression du chapitre
    await prisma.chapterProgress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId
        }
      },
      update: {
        isCompleted: true,
        completedAt: new Date()
      },
      create: {
        userId,
        chapterId,
        isCompleted: true,
        completedAt: new Date()
      }
    })

    // Vérifier si le module est complété
    await checkAndUpdateModuleProgress(userId, chapterId)
  }
}

// Fonction pour vérifier et mettre à jour la progression du module
async function checkAndUpdateModuleProgress(userId: string, chapterId: string) {
  // Récupérer le module du chapitre
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { moduleId: true }
  })

  if (!chapter) return

  // Récupérer tous les chapitres du module
  const moduleChapters = await prisma.chapter.findMany({
    where: { 
      moduleId: chapter.moduleId,
      isActive: true 
    },
    select: { id: true }
  })

  // Vérifier si tous les chapitres sont complétés
  const chapterProgressList = await prisma.chapterProgress.findMany({
    where: {
      userId,
      chapterId: { in: moduleChapters.map(c => c.id) }
    }
  })

  const allChaptersCompleted = moduleChapters.length > 0 && 
    moduleChapters.every(chapter => 
      chapterProgressList.some(progress => 
        progress.chapterId === chapter.id && progress.isCompleted
      )
    )

  if (allChaptersCompleted) {
    // Mettre à jour la progression du module
    await prisma.moduleProgress.upsert({
      where: {
        userId_moduleId: {
          userId,
          moduleId: chapter.moduleId
        }
      },
      update: {
        isCompleted: true,
        completedAt: new Date()
      },
      create: {
        userId,
        moduleId: chapter.moduleId,
        isCompleted: true,
        completedAt: new Date()
      }
    })

    // Créer une notification pour féliciter l'utilisateur
    await prisma.notification.create({
      data: {
        userId,
        title: 'Module complété !',
        content: 'Félicitations ! Vous avez terminé un module de formation.',
        type: 'SUCCESS'
      }
    })
  }
}