import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { answers, score, passed } = body;

    // Validation des données
    if (typeof score !== 'number' || typeof passed !== 'boolean') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Vérifier que le quiz existe
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      select: { id: true }
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 });
    }

    // Vérifier l'unicité du résultat pour cet utilisateur et ce quiz
    const existingResult = await prisma.quizResult.findUnique({
      where: { userId_quizId: { userId: session.user.id, quizId: params.id } },
    });

    if (existingResult) {
      return NextResponse.json({ error: 'Résultat déjà soumis pour ce quiz' }, { status: 400 });
    }

    // Créer le résultat du quiz
    const quizResult = await prisma.quizResult.create({
      data: {
        userId: session.user.id,
        quizId: params.id,
        score,
        answers: answers || [], // S'assurer que answers n'est pas undefined
        passed,
      },
    });

    return NextResponse.json(quizResult, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la soumission du quiz:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}