import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Récupérer tous les modules actifs avec leurs chapitres et contenus
    const modules = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        chapters: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            contents: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                order: true
              }
            },
            quiz: {
              select: {
                id: true,
                title: true,
                passingScore: true
              }
            }
          }
        },
        _count: {
          select: {
            moduleProgress: true
          }
        }
      }
    })

    let userStats = null
    let modulesWithProgress = modules

    if (session?.user?.id) {
      try {
        // Vérifier si l'email est vérifié
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { emailVerified: true }
        })

        if (!user?.emailVerified) {
          return NextResponse.json({
            error: 'Email non vérifié',
            message: 'Veuillez vérifier votre email avant d\'accéder aux modules',
            emailNotVerified: true
          }, { status: 403 })
        }

        // Récupérer la progression de l'utilisateur
        const [moduleProgress, chapterProgress, contentProgress, quizResults] = await Promise.all([
          prisma.moduleProgress.findMany({
            where: { userId: session.user.id },
            include: {
              module: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }),
          prisma.chapterProgress.findMany({
            where: { userId: session.user.id },
            include: {
              chapter: {
                select: {
                  id: true,
                  moduleId: true
                }
              }
            }
          }),
          prisma.contentProgress.findMany({
            where: { userId: session.user.id },
            include: {
              content: {
                select: {
                  id: true,
                  chapterId: true,
                  duration: true
                }
              }
            }
          }),
          prisma.quizResult.findMany({
            where: { 
              userId: session.user.id,
              passed: true
            },
            include: {
              quiz: {
                select: {
                  chapterId: true
                }
              }
            }
          })
        ])

        // Calculer les statistiques utilisateur
        const totalWatchTime = contentProgress.reduce((sum, p) => sum + (p.watchTime || 0), 0)
        const completedModules = moduleProgress.filter(p => p.isCompleted).length
        const averageScore = quizResults.length > 0 
          ? Math.round(quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length)
          : 0

        userStats = {
          totalModules: modules.length,
          completedModules,
          totalWatchTime,
          averageScore
        }

        // Créer des maps pour un accès rapide
        const moduleProgressMap = new Map(moduleProgress.map(p => [p.moduleId, p]))
        const chapterProgressMap = new Map(chapterProgress.map(p => [p.chapterId, p]))
        const contentProgressMap = new Map(contentProgress.map(p => [p.contentId, p]))
        const passedQuizChapterIds = new Set(quizResults.map(r => r.quiz.chapterId))

        // Déterminer quels modules sont débloqués
        modulesWithProgress = modules.map((module, moduleIndex) => {
          const moduleProgressData = moduleProgressMap.get(module.id)
          const isFirstModule = moduleIndex === 0
          
          // Un module est débloqué si c'est le premier ou si le précédent est complété
          let isModuleUnlocked = isFirstModule
          if (!isFirstModule && moduleIndex > 0) {
            const previousModule = modules[moduleIndex - 1]
            const previousModuleProgress = moduleProgressMap.get(previousModule.id)
            isModuleUnlocked = previousModuleProgress?.isCompleted || false
          }

          // Calculer la progression des chapitres
          const chaptersWithProgress = module.chapters.map((chapter, chapterIndex) => {
            const chapterProgressData = chapterProgressMap.get(chapter.id)
            const isFirstChapter = chapterIndex === 0
            
            // Un chapitre est débloqué si c'est le premier du module ou si le précédent est complété
            let isChapterUnlocked = isFirstChapter && isModuleUnlocked
            if (!isFirstChapter && chapterIndex > 0) {
              const previousChapter = module.chapters[chapterIndex - 1]
              const previousChapterProgress = chapterProgressMap.get(previousChapter.id)
              isChapterUnlocked = previousChapterProgress?.isCompleted || false
            }

            // Calculer la progression des contenus
            const contentsWithProgress = chapter.contents.map((content, contentIndex) => {
              const contentProgressData = contentProgressMap.get(content.id)
              const isFirstContent = contentIndex === 0
              
              // Un contenu est débloqué si c'est le premier du chapitre ou si le précédent est complété
              let isContentUnlocked = isFirstContent && isChapterUnlocked
              if (!isFirstContent && contentIndex > 0) {
                const previousContent = chapter.contents[contentIndex - 1]
                const previousContentProgress = contentProgressMap.get(previousContent.id)
                isContentUnlocked = previousContentProgress?.isCompleted || false
              }

              const progressPercentage = contentProgressData && content.duration > 0 
                ? Math.min(100, Math.round((contentProgressData.watchTime / content.duration) * 100))
                : 0

              return {
                ...content,
                isCompleted: contentProgressData?.isCompleted || false,
                isUnlocked: isContentUnlocked,
                progress: progressPercentage,
                watchTime: contentProgressData?.watchTime || 0
              }
            })

            // Un chapitre est complété si tous ses contenus sont complétés
            const allContentsCompleted = chapter.contents.length > 0 && 
              chapter.contents.every(content => contentProgressMap.get(content.id)?.isCompleted)
            
            // Vérifier si le quiz du chapitre est passé
            const quizPassed = chapter.quiz ? passedQuizChapterIds.has(chapter.id) : true

            return {
              ...chapter,
              contents: contentsWithProgress,
              isCompleted: chapterProgressData?.isCompleted || false,
              isUnlocked: isChapterUnlocked,
              allContentsCompleted,
              quizPassed,
              quiz: chapter.quiz ? {
                ...chapter.quiz,
                isPassed: quizPassed
              } : null
            }
          })

          // Un module est complété si tous ses chapitres sont complétés
          const allChaptersCompleted = module.chapters.length > 0 && 
            module.chapters.every(chapter => {
              const chapterProgressData = chapterProgressMap.get(chapter.id)
              return chapterProgressData?.isCompleted || false
            })

          // Calculer la progression globale du module
          const totalContents = module.chapters.reduce((sum, chapter) => sum + chapter.contents.length, 0)
          const completedContents = module.chapters.reduce((sum, chapter) => {
            return sum + chapter.contents.filter(content => 
              contentProgressMap.get(content.id)?.isCompleted
            ).length
          }, 0)
          
          const moduleProgressPercentage = totalContents > 0 
            ? Math.round((completedContents / totalContents) * 100)
            : 0

          return {
            ...module,
            chapters: chaptersWithProgress,
            isCompleted: moduleProgressData?.isCompleted || false,
            isUnlocked: isModuleUnlocked,
            progress: moduleProgressPercentage,
            allChaptersCompleted
          }
        })
      } catch (userError) {
        console.error('Erreur lors de la récupération des données utilisateur:', userError)
        // En cas d'erreur, on continue avec les modules de base
        modulesWithProgress = modules.map((module, index) => ({
          ...module,
          chapters: module.chapters.map((chapter, chapterIndex) => ({
            ...chapter,
            contents: chapter.contents.map((content, contentIndex) => ({
              ...content,
              isCompleted: false,
              isUnlocked: index === 0 && chapterIndex === 0 && contentIndex === 0,
              progress: 0,
              watchTime: 0
            })),
            isCompleted: false,
            isUnlocked: index === 0 && chapterIndex === 0,
            allContentsCompleted: false,
            quizPassed: false,
            quiz: chapter.quiz ? {
              ...chapter.quiz,
              isPassed: false
            } : null
          })),
          isCompleted: false,
          isUnlocked: index === 0,
          progress: 0,
          allChaptersCompleted: false
        }))
      }
    } else {
      // Pour les utilisateurs non connectés, seul le premier contenu du premier chapitre du premier module est visible
      modulesWithProgress = modules.map((module, moduleIndex) => ({
        ...module,
        chapters: module.chapters.map((chapter, chapterIndex) => ({
          ...chapter,
          contents: chapter.contents.map((content, contentIndex) => ({
            ...content,
            isCompleted: false,
            isUnlocked: false, // Aucun contenu débloqué pour les non-connectés
            progress: 0,
            watchTime: 0
          })),
          isCompleted: false,
          isUnlocked: false,
          allContentsCompleted: false,
          quizPassed: false,
          quiz: chapter.quiz ? {
            ...chapter.quiz,
            isPassed: false
          } : null
        })),
        isCompleted: false,
        isUnlocked: false, // Aucun module débloqué pour les non-connectés
        progress: 0,
        allChaptersCompleted: false
      }))
    }

    return NextResponse.json({ 
      modules: modulesWithProgress,
      userStats,
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des modules:', error)
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