import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer le profil utilisateur
    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        pays: true,
        ville: true,
        adresse: true,
        paroisse: true,
        createdAt: true,
        emailVerified: true
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    // Calculer les statistiques de progression
    const [
      totalModules,
      completedModules,
      totalChapters,
      completedChapters,
      totalContents,
      completedContents,
      totalWatchTime,
      quizResults,
      certificates
    ] = await Promise.all([
      prisma.module.count({ where: { isActive: true } }),
      prisma.moduleProgress.count({ 
        where: { 
          userId: session.user.id, 
          isCompleted: true 
        } 
      }),
      prisma.chapter.count({ where: { isActive: true } }),
      prisma.chapterProgress.count({ 
        where: { 
          userId: session.user.id, 
          isCompleted: true 
        } 
      }),
      prisma.content.count({ where: { isActive: true } }),
      prisma.contentProgress.count({ 
        where: { 
          userId: session.user.id, 
          isCompleted: true 
        } 
      }),
      prisma.contentProgress.aggregate({
        where: { userId: session.user.id },
        _sum: { watchTime: true }
      }),
      prisma.quizResult.findMany({
        where: { userId: session.user.id },
        select: { score: true }
      }),
      prisma.certificate.count({
        where: { userId: session.user.id }
      })
    ])

    const averageScore = quizResults.length > 0 
      ? Math.round(quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length)
      : 0

    // Récupérer l'activité récente
    const [recentModuleCompletions, recentChapterCompletions, recentContentCompletions, recentQuizResults] = await Promise.all([
      prisma.moduleProgress.findMany({
        where: { 
          userId: session.user.id,
          isCompleted: true 
        },
        include: {
          module: {
            select: { title: true, order: true }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 5
      }),
      prisma.chapterProgress.findMany({
        where: { 
          userId: session.user.id,
          isCompleted: true 
        },
        include: {
          chapter: {
            select: { title: true, order: true }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 5
      }),
      prisma.contentProgress.findMany({
        where: { 
          userId: session.user.id,
          isCompleted: true 
        },
        include: {
          content: {
            select: { title: true }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 5
      }),
      prisma.quizResult.findMany({
        where: { 
          userId: session.user.id,
          passed: true 
        },
        include: {
          quiz: {
            select: { title: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    const recentActivity = [
      ...recentModuleCompletions.map(completion => ({
        id: `module-${completion.id}`,
        type: 'module_completed' as const,
        title: `Module ${completion.module.order}: ${completion.module.title}`,
        date: completion.completedAt?.toISOString() || completion.createdAt.toISOString()
      })),
      ...recentChapterCompletions.map(completion => ({
        id: `chapter-${completion.id}`,
        type: 'chapter_completed' as const,
        title: `Chapitre ${completion.chapter.order}: ${completion.chapter.title}`,
        date: completion.completedAt?.toISOString() || completion.createdAt.toISOString()
      })),
      ...recentContentCompletions.map(completion => ({
        id: `content-${completion.id}`,
        type: 'content_completed' as const,
        title: completion.content.title,
        date: completion.completedAt?.toISOString() || completion.createdAt.toISOString()
      })),
      ...recentQuizResults.map(result => ({
        id: `quiz-${result.id}`,
        type: 'quiz_passed' as const,
        title: result.quiz.title,
        date: result.createdAt.toISOString(),
        score: result.score
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    const stats = {
      totalModules,
      completedModules,
      totalChapters,
      completedChapters,
      totalContents,
      completedContents,
      totalWatchTime: totalWatchTime._sum.watchTime || 0,
      averageScore,
      certificates,
      lastActivity: recentActivity.length > 0 ? recentActivity[0].date : null
    }

    return NextResponse.json({
      profile,
      stats,
      recentActivity
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nom, prenom, telephone, pays, ville, adresse, paroisse } = body

    // Validation des champs obligatoires
    if (!nom?.trim() || !prenom?.trim() || !telephone?.trim() || !pays?.trim() || !ville?.trim()) {
      return NextResponse.json(
        { error: 'Les champs nom, prénom, téléphone, pays et ville sont obligatoires' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        pays: pays.trim(),
        ville: ville.trim(),
        adresse: adresse?.trim() || null,
        paroisse: paroisse?.trim() || null
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        pays: true,
        ville: true,
        adresse: true,
        paroisse: true,
        createdAt: true,
        emailVerified: true
      }
    })

    return NextResponse.json({
      profile: updatedUser,
      message: 'Profil mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}