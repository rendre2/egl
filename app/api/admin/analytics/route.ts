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

    // Score moyen des quiz
    const quizResults = await prisma.quizResult.aggregate({
      _avg: {
        score: true
      }
    })
    const averageScore = Math.round(quizResults._avg.score || 0)

    // Utilisateurs par pays
    const usersByCountryRaw = await prisma.user.groupBy({
      by: ['pays'],
      _count: {
        pays: true
      },
      orderBy: {
        _count: {
          pays: 'desc'
        }
      },
      take: 10
    })

    const usersByCountry = usersByCountryRaw.reduce((acc, item) => {
      acc[item.pays] = item._count.pays
      return acc
    }, {} as { [key: string]: number })

    // Progression par module
    const modules = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        moduleProgress: {
          select: {
            isCompleted: true
          }
        }
      }
    })

    const moduleProgress = modules.map(module => {
      const totalUsers = module.moduleProgress.length
      const completedUsers = module.moduleProgress.filter(p => p.isCompleted).length

      return {
        id: module.id,
        title: module.title,
        order: module.order,
        totalUsers,
        completedUsers,
        averageWatchTime: 0, // Calculé différemment maintenant
        duration: 0 // Plus applicable au niveau module
      }
    })

    // Activité récente
    const [recentRegistrations, recentModuleCompletions, recentQuizPasses, recentVerifications] = await Promise.all([
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          prenom: true,
          nom: true,
          createdAt: true
        }
      }),
      prisma.moduleProgress.findMany({
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
      }),
      prisma.quizResult.findMany({
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
      }),
      prisma.user.findMany({
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
    ])

    const recentActivity = [
      ...recentRegistrations.map(user => ({
        id: `reg-${user.id}`,
        type: 'registration' as const,
        user: `${user.prenom} ${user.nom}`,
        date: user.createdAt.toISOString()
      })),
      ...recentModuleCompletions.map(completion => ({
        id: `comp-${completion.id}`,
        type: 'completion' as const,
        user: `${completion.user.prenom} ${completion.user.nom}`,
        module: `Module ${completion.module.order}: ${completion.module.title}`,
        date: completion.completedAt?.toISOString() || completion.createdAt.toISOString()
      })),
      ...recentQuizPasses.map(result => ({
        id: `quiz-${result.id}`,
        type: 'quiz_passed' as const,
        user: `${result.user.prenom} ${result.user.nom}`,
        module: `Module ${result.quiz.chapter.module.order}: ${result.quiz.chapter.module.title}`,
        date: result.createdAt.toISOString()
      })),
      ...recentVerifications.map(user => ({
        id: `verify-${user.id}`,
        type: 'email_verified' as const,
        user: `${user.prenom} ${user.nom}`,
        date: user.emailVerified?.toISOString() || new Date().toISOString()
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15)

    const analytics = {
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
      usersByCountry,
      moduleProgress,
      recentActivity
    }

    return NextResponse.json(analytics)
  } catch (error: any) {
    console.error('Erreur lors de la récupération des analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}