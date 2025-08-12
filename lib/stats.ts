import { prisma } from '@/lib/prisma'

export async function getCommonStats(startOfMonth: Date) {
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
    registrationsThisMonth,
    moduleCompletionsThisMonth
  ] = await Promise.all([
    // Nombre total d'utilisateurs
    prisma.user.count(),
    
    // Utilisateurs vérifiés
    prisma.user.count({
      where: {
        emailVerified: {
          not: null
        }
      }
    }),
    
    // Utilisateurs actifs (qui ont au moins une progression)
    prisma.user.count({
      where: {
        OR: [
          { moduleProgress: { some: {} } },
          { chapterProgress: { some: {} } },
          { contentProgress: { some: {} } }
        ]
      }
    }),
    
    // Nombre total de modules
    prisma.module.count(),
    
    // Modules actifs
    prisma.module.count({ where: { isActive: true } }),
    
    // Nombre total de chapitres
    prisma.chapter.count(),
    
    // Nombre total de contenus
    prisma.content.count(),
    
    // Nombre total de quiz
    prisma.quiz.count(),
    
    // Modules complétés
    prisma.moduleProgress.count({ where: { isCompleted: true } }),
    
    // Chapitres complétés
    prisma.chapterProgress.count({ where: { isCompleted: true } }),
    
    // Contenus complétés
    prisma.contentProgress.count({ where: { isCompleted: true } }),
    
    // Inscriptions ce mois
    prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    }),
    
    // Complétions de modules ce mois
    prisma.moduleProgress.count({
      where: {
        isCompleted: true,
        completedAt: {
          gte: startOfMonth
        }
      }
    })
  ])

  // Calcul de la moyenne des scores des quiz
  const quizResults = await prisma.quizResult.aggregate({
    _avg: {
      score: true
    }
  })
  const averageScore = Math.round(quizResults._avg.score || 0)

  // Statistiques détaillées sur les contenus actifs
  const activeContents = await prisma.content.count({
    where: {
      isActive: true,
      chapter: {
        isActive: true,
        module: {
          isActive: true
        }
      }
    }
  })

  // Statistiques sur les quiz actifs
  const activeQuizzes = await prisma.quiz.count({
    where: {
      chapter: {
        isActive: true,
        module: {
          isActive: true
        }
      }
    }
  })

  // Taux de réussite global des quiz
  const [totalQuizAttempts, passedQuizAttempts] = await Promise.all([
    prisma.quizResult.count(),
    prisma.quizResult.count({ where: { passed: true } })
  ])

  const successRate = totalQuizAttempts > 0 
    ? Math.round((passedQuizAttempts / totalQuizAttempts) * 100)
    : 0

  // Calcul du temps total de visionnage
  const watchTimeStats = await prisma.contentProgress.aggregate({
    _sum: {
      watchTime: true
    }
  })
  const totalWatchTime = watchTimeStats._sum.watchTime || 0

  return {
    // Statistiques des utilisateurs
    totalUsers,
    verifiedUsers,
    unverifiedUsers: totalUsers - verifiedUsers,
    activeUsers,
    
    // Statistiques du contenu
    totalModules,
    activeModules,
    totalChapters,
    totalContents,
    activeContents,
    totalQuizzes,
    activeQuizzes,
    
    // Statistiques de progression
    completedModules,
    completedChapters,
    completedContents,
    
    // Métriques de performance
    averageScore,
    successRate,
    totalWatchTime: Math.round(totalWatchTime / 60),
    
    // Statistiques mensuelles
    registrationsThisMonth,
    completionsThisMonth: moduleCompletionsThisMonth,
    
    // Ratios utiles
    moduleCompletionRate: totalModules > 0 
      ? Math.round((completedModules / (totalModules * Math.max(1, totalUsers))) * 100)
      : 0,
    userEngagementRate: totalUsers > 0 
      ? Math.round((activeUsers / totalUsers) * 100)
      : 0,
    verificationRate: totalUsers > 0 
      ? Math.round((verifiedUsers / totalUsers) * 100)
      : 0
  }
}

// Fonction utilitaire pour obtenir des statistiques détaillées par module
export async function getModuleStats() {
  const modules = await prisma.module.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      order: true,
      _count: {
        select: {
          moduleProgress: true,
          chapters: {
            where: { isActive: true }
          }
        }
      }
    },
    orderBy: { order: 'asc' }
  })

  const moduleStatsWithCompletion = await Promise.all(
    modules.map(async (module) => {
      const completedCount = await prisma.moduleProgress.count({
        where: {
          moduleId: module.id,
          isCompleted: true
        }
      })

      const completionRate = module._count.moduleProgress > 0 
        ? Math.round((completedCount / module._count.moduleProgress) * 100)
        : 0

      return {
        id: module.id,
        title: module.title,
        order: module.order,
        chaptersCount: module._count.chapters,
        enrolledUsers: module._count.moduleProgress,
        completedUsers: completedCount,
        completionRate
      }
    })
  )

  return moduleStatsWithCompletion
}

// Fonction pour obtenir l'activité récente
export async function getRecentActivity(limit: number = 10) {
  // Récupérer les inscriptions récentes
  const recentRegistrations = await prisma.user.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      prenom: true,
      nom: true,
      createdAt: true
    }
  })

  // Récupérer les complétions récentes de modules
  const recentCompletions = await prisma.moduleProgress.findMany({
    where: { isCompleted: true },
    take: limit,
    orderBy: { completedAt: 'desc' },
    select: {
      completedAt: true,
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

  // Récupérer les quiz récemment réussis
  const recentQuizzes = await prisma.quizResult.findMany({
    where: { passed: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      score: true,
      user: {
        select: {
          prenom: true,
          nom: true
        }
      },
      quiz: {
        select: {
          title: true,
          chapter: {
            select: {
              title: true,
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

  // Formater l'activité récente
  const recentActivity = [
    ...recentRegistrations.map(user => ({
      id: `reg-${user.id}`,
      type: 'registration' as const,
      user: `${user.prenom} ${user.nom}`,
      date: user.createdAt.toISOString()
    })),
    ...recentCompletions.map(completion => ({
      id: `comp-${completion.user.nom}-${completion.module.order}`,
      type: 'module_completed' as const,
      user: `${completion.user.prenom} ${completion.user.nom}`,
      module: `Module ${completion.module.order}: ${completion.module.title}`,
      date: (completion.completedAt || new Date()).toISOString()
    })),
    ...recentQuizzes.map(quiz => ({
      id: `quiz-${quiz.user.nom}-${quiz.quiz.chapter.module.order}`,
      type: 'quiz_passed' as const,
      user: `${quiz.user.prenom} ${quiz.user.nom}`,
      module: `Module ${quiz.quiz.chapter.module.order}: ${quiz.quiz.chapter.module.title}`,
      chapter: quiz.quiz.chapter.title,
      score: quiz.score,
      date: quiz.createdAt.toISOString()
    }))
  ]

  // Trier par date décroissante et limiter
  return recentActivity
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}