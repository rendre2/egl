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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, questions, passingScore } = body

    // Validation des données
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Le titre est obligatoire' },
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

    // Nettoyer et structurer les questions
    const cleanQuestions = questions.map((q: Question, index: number) => ({
      id: q.id || `q${index + 1}`,
      question: q.question.trim(),
      type: q.type,
      options: q.type === 'multiple_choice' ? q.options?.map(opt => opt.trim()) : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation?.trim() || ''
    }))

    // Mise à jour du quiz - pas besoin de JSON.stringify
    const quiz = await prisma.quiz.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        questions: cleanQuestions, // Directement l'objet
        passingScore: parseInt(passingScore.toString())
      },
      include: {
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
      message: 'QCM mis à jour avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du QCM:', error)
    
    // Gestion spécifique des erreurs Prisma
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'QCM introuvable' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour du QCM',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Vérifier si le quiz existe
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            results: true
          }
        }
      }
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'QCM introuvable' },
        { status: 404 }
      )
    }

    // Supprimer d'abord les résultats (CASCADE défini dans le schéma mais soyons explicites)
    await prisma.quizResult.deleteMany({
      where: { quizId: params.id }
    })

    // Supprimer le quiz
    await prisma.quiz.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'QCM supprimé avec succès',
      deletedResults: existingQuiz._count.results,
      success: true 
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du QCM:', error)
    
    // Gestion spécifique des erreurs Prisma
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'QCM introuvable' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du QCM',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        success: false
      },
      { status: 500 }
    )
  }
}