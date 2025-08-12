import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { score, passed } = await request.json()

    if (typeof score !== 'number' || typeof passed !== 'boolean') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      select: { id: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    const result = await prisma.quizResult.create({
      data: {
        userId: session.user.id,
        quizId: params.id,
        score,
        passed,
        answers: [],
        createdAt: new Date()
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement du résultat du quiz:', error)
    return NextResponse.json({ error: error.message || 'Erreur interne du serveur' }, { status: 500 })
  }
}