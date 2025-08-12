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

    // Vérifier que le chapitre existe et est actif
    const chapter = await prisma.chapter.findUnique({
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
        }
      }
    })

    if (!chapter || !chapter.isActive || !chapter.module.isActive) {
      return NextResponse.json({ error: 'Chapitre non trouvé ou inactif' }, { status: 404 })
    }

    // Vérifier la progression de l'utilisateur pour ce chapitre
    // L'utilisateur doit avoir terminé tous les contenus du chapitre
    const chapterContents = await prisma.content.findMany({
      where: { 
        chapterId: params.id,
        isActive: true
      },
      select: { id: true }
    })

    if (chapterContents.length === 0) {
      return NextResponse.json({ error: 'Aucun contenu disponible dans ce chapitre' }, { status: 404 })
    }

    // Vérifier que tous les contenus sont terminés
    const completedContents = await prisma.contentProgress.findMany({
      where: { 
        userId: session.user.id,
        contentId: { in: chapterContents.map(c => c.id) },
        isCompleted: true
      },
      select: { contentId: true }
    })

    if (completedContents.length < chapterContents.length) {
      return NextResponse.json({ 
        error: 'Vous devez d\'abord terminer tous les contenus du chapitre pour accéder au quiz' 
      }, { status: 403 })
    }

    // Récupérer le quiz pour ce chapitre
    const quiz = await prisma.quiz.findUnique({
      where: { chapterId: params.id },
      select: {
        id: true,
        chapterId: true,
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
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Aucun quiz disponible pour ce chapitre' }, { status: 404 })
    }

    // Si l'utilisateur a déjà passé le quiz avec succès
    if (quiz.results.length > 0) {
      const result = quiz.results[0]
      
      // Si le quiz est réussi, ne pas permettre de le refaire
      if (result.passed) {
        return NextResponse.json({ 
          error: 'Quiz déjà complété avec succès',
          alreadyCompleted: true,
          result: {
            score: result.score,
            passed: result.passed,
            completedAt: result.createdAt
          }
        }, { status: 400 })
      }
      // Si le quiz n'est pas réussi, permettre de le refaire mais informer l'utilisateur
      else {
        console.log(`L'utilisateur ${session.user.id} peut refaire le quiz ${quiz.id} (score précédent: ${result.score})`)
      }
    }

    // Parser les questions JSON
    let parsedQuestions
    try {
      parsedQuestions = typeof quiz.questions === 'string' 
        ? JSON.parse(quiz.questions) 
        : quiz.questions
    } catch (error) {
      console.error('Erreur lors du parsing des questions:', error)
      return NextResponse.json({ error: 'Format de questions invalide' }, { status: 500 })
    }

    // Valider la structure des questions
    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return NextResponse.json({ error: 'Aucune question disponible pour ce quiz' }, { status: 404 })
    }

    // Vérifier que chaque question a la structure attendue selon vos types
    const isValidQuestions = parsedQuestions.every(q => 
      q.id && 
      q.question && 
      q.type && 
      (q.type === 'true_false' || (q.type === 'multiple_choice' && Array.isArray(q.options))) &&
      (typeof q.correctAnswer === 'number' || typeof q.correctAnswer === 'boolean')
    )

    if (!isValidQuestions) {
      return NextResponse.json({ error: 'Structure de questions invalide' }, { status: 500 })
    }

    // Retourner le quiz sans les bonnes réponses et explications pour la sécurité
    const questionsForUser = parsedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options || undefined
      // Ne pas inclure correctAnswer et explanation
    }))

    return NextResponse.json({
      id: quiz.id,
      chapterId: quiz.chapterId,
      title: quiz.title || `Quiz - ${chapter.title}`,
      questions: questionsForUser,
      passingScore: quiz.passingScore,
      timeLimit: 30, // 30 minutes par défaut
      moduleTitle: chapter.module.title,
      chapterTitle: chapter.title,
      previousAttempt: quiz.results.length > 0 ? {
        score: quiz.results[0].score,
        passed: quiz.results[0].passed
      } : null
    })

  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}