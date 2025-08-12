import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Statistiques de base
    const [
      totalUsers,
      verifiedUsers,
      activeUsers,
      totalModules,
      activeModules,
      totalChapters,
      totalContents,
      totalQuizzes,
      completedModules,
      completedChapters,
      completedContents,
      registrationsThisMonth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          emailVerified: {
            not: null
          }
        }
      }),
      prisma.user.count({
        where: {
          moduleProgress: {
            some: {}
          }
        }
      }),
      prisma.module.count(),
      prisma.module.count({ where: { isActive: true } }),
      prisma.chapter.count({ where: { isActive: true } }),
      prisma.content.count({ where: { isActive: true } }),
      prisma.quiz.count(),
      prisma.moduleProgress.count({ where: { isCompleted: true } }),
      prisma.chapterProgress.count({ where: { isCompleted: true } }),
      prisma.contentProgress.count({ where: { isCompleted: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      })
    ])

    // Calcul du score moyen
    const quizResults = await prisma.quizResult.aggregate({
      _avg: {
        score: true
      }
    })
    const averageScore = Math.round(quizResults._avg.score || 0)

    // Activité récente - Inscriptions
    const recentRegistrations = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prenom: true,
        nom: true,
        createdAt: true
      }
    })

    // Activité récente - Complétions de modules
    const recentModuleCompletions = await prisma.moduleProgress.findMany({
      take: 5,
      where: { isCompleted: true },
      orderBy: { completedAt: 'desc' },
      include: {
        user: {
          select: {
            prenom: true,
            nom: true
          }
        },
        module: {
          select: {
            title: true,
            order: true
          }
        }
      }
    })

    // Activité récente - QCM réussis
    const recentQuizPasses = await prisma.quizResult.findMany({
      take: 5,
      where: { passed: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            prenom: true,
            nom: true
          }
        },
        quiz: {
          include: {
            chapter: {
              include: {
                module: {
                  select: {
                    title: true,
                    order: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Activité récente - Vérifications d'email
    const recentVerifications = await prisma.user.findMany({
      take: 5,
      where: {
        emailVerified: {
          not: null,
          gte: startOfMonth
        }
      },
      orderBy: { emailVerified: 'desc' },
      select: {
        id: true,
        prenom: true,
        nom: true,
        emailVerified: true
      }
    })

    // Construire l'activité récente avec gestion des valeurs nulles/undefined
    const recentActivity = [
      ...recentRegistrations.map(user => ({
        id: `reg-${user.id}`,
        type: 'registration' as const,
        user: `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur inconnu',
        date: user.createdAt.toISOString()
      })),
      ...recentModuleCompletions.map(completion => ({
        id: `comp-${completion.id}`,
        type: 'completion' as const,
        user: `${completion.user?.prenom || ''} ${completion.user?.nom || ''}`.trim() || 'Utilisateur inconnu',
        module: completion.module ? `Module ${completion.module.order}: ${completion.module.title}` : 'Module inconnu',
        date: completion.completedAt?.toISOString() || completion.createdAt.toISOString()
      })),
      ...recentQuizPasses.map(result => ({
        id: `quiz-${result.id}`,
        type: 'quiz_passed' as const,
        user: `${result.user?.prenom || ''} ${result.user?.nom || ''}`.trim() || 'Utilisateur inconnu',
        module: result.quiz?.chapter?.module 
          ? `Module ${result.quiz.chapter.module.order}: ${result.quiz.chapter.module.title}`
          : 'Module inconnu',
        date: result.createdAt.toISOString()
      })),
      ...recentVerifications.map(user => ({
        id: `verify-${user.id}`,
        type: 'email_verified' as const,
        user: `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur inconnu',
        date: user.emailVerified?.toISOString() || new Date().toISOString()
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15)

    const stats = {
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      activeUsers,
      totalModules,
      activeModules,
      totalChapters,
      totalContents,
      totalQuizzes,
      completedModules,
      completedChapters,
      completedContents,
      averageScore,
      registrationsThisMonth,
      completionsThisMonth: completedModules,
      recentActivity
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}