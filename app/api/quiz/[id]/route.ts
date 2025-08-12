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

    // Vérifier si l'email est vérifié
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true }
    })

    if (!user?.emailVerified) {
      return NextResponse.json({
        error: 'Email non vérifié',
        message: 'Veuillez vérifier votre email avant d\'accéder aux quiz'
      }, { status: 403 })
    }

    // Vérifier que le quiz existe
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
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

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Vérifier que tous les contenus du chapitre sont complétés
    const chapterContents = await prisma.content.findMany({
      where: { 
        chapterId: quiz.chapterId,
        isActive: true 
      },
      select: { id: true }
    })

    const completedContents = await prisma.contentProgress.count({
      where: {
        userId: session.user.id,
        contentId: { in: chapterContents.map(c => c.id) },
        isCompleted: true
      }
    })

    if (completedContents < chapterContents.length) {
      return NextResponse.json({ 
        error: 'Chapitre non terminé',
        message: 'Vous devez terminer tous les contenus du chapitre avant d\'accéder au quiz'
      }, { status: 403 })
    }

    // Vérifier si l'utilisateur a déjà passé le quiz
    const existingResult = await prisma.quizResult.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: params.id
        }
      },
      select: {
        score: true,
        passed: true,
        createdAt: true
      }
    })

    if (existingResult) {
      return NextResponse.json({ 
        error: 'Quiz déjà complété',
        alreadyCompleted: true,
        result: {
          score: existingResult.score,
          passed: existingResult.passed,
          completedAt: existingResult.createdAt
        }
      }, { status: 400 })
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

    return NextResponse.json({
      id: quiz.id,
      chapterId: quiz.chapterId,
      title: quiz.title,
      questions: parsedQuestions,
      passingScore: quiz.passingScore,
      timeLimit: 30, // 30 minutes par défaut
      chapter: {
        id: quiz.chapter.id,
        title: quiz.chapter.title,
        order: quiz.chapter.order,
        module: {
          id: quiz.chapter.module.id,
          title: quiz.chapter.module.title,
          order: quiz.chapter.module.order
        }
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}