import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Question {
  id?: string
  question: string
  type: 'multiple_choice' | 'true_false'
  options: string[]
  correctAnswer: number
  explanation?: string
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const quizzes = await prisma.quiz.findMany({
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
        },
        _count: {
          select: {
            results: true
          }
        }
      },
      orderBy: {
        chapter: {
          module: {
            order: 'asc'
          }
        }
      }
    })

    // Le champ questions est déjà JSON dans le schéma, pas besoin de parser
    const formattedQuizzes = quizzes.map(quiz => ({
      ...quiz,
      questions: quiz.questions as unknown as Question[] // Cast via unknown pour satisfaire TypeScript
    }))

    return NextResponse.json({ 
      quizzes: formattedQuizzes,
      success: true 
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des QCM:', error)
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { chapterId, title, questions, passingScore } = body

    // Validation des données
    if (!chapterId?.trim() || !title?.trim()) {
      return NextResponse.json(
        { error: 'Le chapitre et le titre sont obligatoires' },
        { status: 400 }
      )
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Au moins une question est requise' },
        { status: 400 }
      )
    }

    if (passingScore < 0 || passingScore > 100) {
      return NextResponse.json(
        { error: 'Le score minimum doit être entre 0 et 100' },
        { status: 400 }
      )
    }

    // Validation des questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i] as Question
      
      if (!question.question?.trim()) {
        return NextResponse.json(
          { error: `La question ${i + 1} ne peut pas être vide` },
          { status: 400 }
        )
      }

      if (question.type === 'multiple_choice') {
        if (!question.options || question.options.length !== 4) {
          return NextResponse.json(
            { error: `La question ${i + 1} doit avoir exactement 4 options` },
            { status: 400 }
          )
        }

        // Vérifier que toutes les options sont remplies
        for (let j = 0; j < question.options.length; j++) {
          if (!question.options[j]?.trim()) {
            return NextResponse.json(
              { error: `L'option ${j + 1} de la question ${i + 1} ne peut pas être vide` },
              { status: 400 }
            )
          }
        }

        if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer >= 4) {
          return NextResponse.json(
            { error: `La réponse correcte de la question ${i + 1} doit être entre 0 et 3` },
            { status: 400 }
          )
        }
      } else if (question.type === 'true_false') {
        if (typeof question.correctAnswer !== 'boolean') {
          return NextResponse.json(
            { error: `La réponse correcte de la question ${i + 1} doit être Vrai ou Faux` },
            { status: 400 }
          )
        }
      }
    }

    // Vérifier si le chapitre existe
    const chapterExists = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, title: true }
    })

    if (!chapterExists) {
      return NextResponse.json(
        { error: 'Chapitre introuvable' },
        { status: 404 }
      )
    }

    // Vérifier si un quiz existe déjà pour ce chapitre
    const existingQuiz = await prisma.quiz.findUnique({
      where: { chapterId }
    })

    if (existingQuiz) {
      return NextResponse.json(
        { error: 'Un QCM existe déjà pour ce chapitre' },
        { status: 400 }
      )
    }

    // Nettoyer et structurer les questions
    const cleanQuestions = questions.map((q: Question, index: number) => ({
      id: `q${index + 1}`,
      question: q.question.trim(),
      type: q.type,
      options: q.type === 'multiple_choice' ? q.options?.map(opt => opt.trim()) : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation?.trim() || ''
    }))

    // Créer le quiz - pas besoin de JSON.stringify, Prisma gère automatiquement
    const quiz = await prisma.quiz.create({
      data: {
        chapterId,
        title: title.trim(),
        questions: cleanQuestions, // Directement l'objet, pas de JSON.stringify
        passingScore: parseInt(passingScore.toString())
      },
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
        },
        _count: {
          select: {
            results: true
          }
        }
      }
    })

    return NextResponse.json({ 
      quiz: {
        ...quiz,
        questions: cleanQuestions
      },
      message: 'QCM créé avec succès',
      success: true
    }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du QCM:', error)
    
    // Gestion spécifique des erreurs Prisma
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Un QCM existe déjà pour ce chapitre' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du QCM',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        success: false
      },
      { status: 500 }
    )
  }
}