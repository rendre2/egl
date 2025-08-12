import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 })
    }

    // Vérifier si l'email est vérifié
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true }
    })

    if (!user?.emailVerified) {
      return NextResponse.json({
        error: 'Email non vérifié',
        message: 'Veuillez vérifier votre email avant d\'accéder aux contenus'
      }, { status: 403 })
    }

    // Récupérer le contenu demandé
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
                title: true,
                order: true
              }
            }
          }
        }
      }
    })

    if (!content) {
      return NextResponse.json({ error: 'Contenu non trouvé' }, { status: 404 })
    }

    // Vérifier si le contenu est déverrouillé
    const isUnlocked = await checkContentUnlocked(session.user.id, content)
    
    if (!isUnlocked) {
      return NextResponse.json({ 
        error: 'Contenu verrouillé',
        message: 'Vous devez terminer le contenu précédent pour accéder à celui-ci.'
      }, { status: 403 })
    }

    // Récupérer la progression de l'utilisateur
    const progress = await prisma.contentProgress.findUnique({
      where: { 
        userId_contentId: { 
          userId: session.user.id, 
          contentId: params.id 
        } 
      },
      select: { 
        watchTime: true, 
        isCompleted: true 
      }
    })

    // Récupérer les contenus précédent et suivant pour la navigation
    const chapterContents = await prisma.content.findMany({
      where: { 
        chapterId: content.chapterId,
        isActive: true 
      },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, type: true, order: true }
    })

    const currentIndex = chapterContents.findIndex(c => c.id === params.id)
    const previousContent = currentIndex > 0 ? chapterContents[currentIndex - 1] : null
    const nextContent = currentIndex < chapterContents.length - 1 ? chapterContents[currentIndex + 1] : null

    // Vérifier si le contenu suivant est débloqué
    let nextContentUnlocked = false
    if (nextContent) {
      nextContentUnlocked = await checkContentUnlocked(session.user.id, { 
        ...nextContent, 
        chapterId: content.chapterId 
      })
    }

    const progressPercentage = progress && content.duration > 0 
      ? Math.min(100, Math.round((progress.watchTime / content.duration) * 100))
      : 0

    return NextResponse.json({
      ...content,
      progress: progressPercentage,
      isCompleted: progress?.isCompleted || false,
      watchTime: progress?.watchTime || 0,
      navigation: {
        previous: previousContent ? {
          id: previousContent.id,
          title: previousContent.title,
          type: previousContent.type,
          unlocked: true // Le précédent est toujours accessible
        } : null,
        next: nextContent ? {
          id: nextContent.id,
          title: nextContent.title,
          type: nextContent.type,
          unlocked: nextContentUnlocked
        } : null
      },
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      success: false
    }, { status: 500 })
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
  
  // Le premier contenu est débloqué si le chapitre est débloqué
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