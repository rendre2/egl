import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Récupérer le chapitre avec ses relations en une seule requête optimisée
    const chapterData = await prisma.chapter.findUnique({
      where: { id: params.id },
      select: { 
        id: true, 
        isActive: true, 
        title: true,
        module: {
          select: {
            id: true,
            title: true,
            isActive: true
          }
        },
        contents: {
          where: { isActive: true },
          select: { id: true },
          orderBy: { order: 'asc' }
        },
        quiz: {
          select: {
            id: true,
            title: true,
            questions: true,
            passingScore: true,
            results: {
              where: { userId: session.user.id },
              select: { id: true, score: true, passed: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    // Vérifications de base
    if (!chapterData || !chapterData.isActive || !chapterData.module.isActive) {
      return NextResponse.json({ error: 'Chapitre non trouvé ou inactif' }, { status: 404 })
    }

    if (chapterData.contents.length === 0) {
      return NextResponse.json({ error: 'Aucun contenu disponible dans ce chapitre' }, { status: 404 })
    }

    if (!chapterData.quiz) {
      return NextResponse.json({ error: 'Aucun quiz disponible pour ce chapitre' }, { status: 404 })
    }

    // Vérifier que tous les contenus sont terminés
    const completedContents = await prisma.contentProgress.findMany({
      where: { 
        userId: session.user.id,
        contentId: { in: chapterData.contents.map(c => c.id) },
        isCompleted: true
      },
      select: { contentId: true }
    })

    if (completedContents.length < chapterData.contents.length) {
      const remainingContents = chapterData.contents.length - completedContents.length
      return NextResponse.json({ 
        error: `Vous devez d'abord terminer tous les contenus du chapitre pour accéder au quiz`,
        details: `${remainingContents} contenu(s) restant(s) à terminer sur ${chapterData.contents.length}`
      }, { status: 403 })
    }

    const quiz = chapterData.quiz

    // Gestion des tentatives précédentes
    if (quiz.results.length > 0) {
      const result = quiz.results[0]
      
      // Si le quiz est réussi, ne pas permettre de le refaire
      if (result.passed) {
        return NextResponse.json({ 
          message: 'Quiz déjà complété avec succès',
          alreadyCompleted: true,
          result: {
            score: result.score,
            passed: result.passed,
            completedAt: result.createdAt
          }
        }, { status: 200 }) // Status 200 plutôt que 400 car ce n'est pas une erreur
      }
      
      // Si le quiz n'est pas réussi, permettre de le refaire
      console.log(`Utilisateur ${session.user.id} reprend le quiz ${quiz.id} (tentative précédente: ${result.score}%)`)
    }

    // Parser et valider les questions JSON
    let parsedQuestions
    try {
      parsedQuestions = typeof quiz.questions === 'string' 
        ? JSON.parse(quiz.questions) 
        : quiz.questions
    } catch (error) {
      console.error('Erreur lors du parsing des questions:', error)
      return NextResponse.json({ error: 'Format de questions invalide' }, { status: 500 })
    }

    // Validation de la structure des questions
    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return NextResponse.json({ error: 'Aucune question disponible pour ce quiz' }, { status: 404 })
    }

    // Validation détaillée selon les types définis
    const invalidQuestions = parsedQuestions.filter((q, index) => {
      if (!q.id || !q.question || !q.type) {
        console.error(`Question ${index + 1}: Champs obligatoires manquants`)
        return true
      }
      
      if (q.type === 'multiple_choice') {
        if (!Array.isArray(q.options) || q.options.length < 2) {
          console.error(`Question ${index + 1}: Options invalides pour une question à choix multiple`)
          return true
        }
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          console.error(`Question ${index + 1}: Index de réponse correcte invalide`)
          return true
        }
      } else if (q.type === 'true_false') {
        if (typeof q.correctAnswer !== 'boolean') {
          console.error(`Question ${index + 1}: Réponse correcte doit être un booléen pour une question vrai/faux`)
          return true
        }
      } else {
        console.error(`Question ${index + 1}: Type de question non supporté: ${q.type}`)
        return true
      }
      
      return false
    })

    if (invalidQuestions.length > 0) {
      return NextResponse.json({ 
        error: 'Structure de questions invalide',
        details: `${invalidQuestions.length} question(s) invalide(s) détectée(s)`
      }, { status: 500 })
    }

    // Préparer les questions pour l'utilisateur (sans les réponses)
    const questionsForUser = parsedQuestions.map((q, index) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      ...(q.type === 'multiple_choice' && { options: q.options })
    }))

    // Calculer les statistiques
    const totalQuestions = parsedQuestions.length
    const timeEstimate = Math.ceil(totalQuestions * 1.5) // 1.5 min par question en moyenne

    return NextResponse.json({
      id: quiz.id,
      chapterId: chapterData.id,
      title: quiz.title || `Quiz - ${chapterData.title}`,
      questions: questionsForUser,
      passingScore: quiz.passingScore,
      timeLimit: Math.max(timeEstimate, 10), // Minimum 10 minutes
      totalQuestions,
      moduleInfo: {
        id: chapterData.module.id,
        title: chapterData.module.title
      },
      chapterInfo: {
        id: chapterData.id,
        title: chapterData.title
      },
      previousAttempt: quiz.results.length > 0 ? {
        score: quiz.results[0].score,
        passed: quiz.results[0].passed,
        attemptedAt: quiz.results[0].createdAt
      } : null,
      instructions: {
        passingScore: quiz.passingScore,
        timeLimit: Math.max(timeEstimate, 10),
        canRetry: true,
        totalQuestions
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error)
    
    // Log plus détaillé pour le debugging
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
    
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error instanceof Error ? error.message : 'Erreur inconnue' 
      })
    }, { status: 500 })
  }
}