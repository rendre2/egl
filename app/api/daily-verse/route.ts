import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Récupérer le verset du jour
    const dailyVerse = await prisma.dailyVerse.findUnique({
      where: { date: today },
      select: {
        verse: true,
        reference: true,
        date: true
      }
    })

    if (!dailyVerse) {
      // Retourner un verset par défaut si aucun n'est configuré
      return NextResponse.json({
        verse: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.",
        reference: "Jérémie 29:11",
        date: today.toISOString()
      })
    }

    return NextResponse.json(dailyVerse)
  } catch (error) {
    console.error('Erreur lors de la récupération du verset du jour:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { verse, reference, date } = body

    if (!verse?.trim() || !reference?.trim() || !date) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    const verseDate = new Date(date)
    verseDate.setHours(0, 0, 0, 0)

    const dailyVerse = await prisma.dailyVerse.upsert({
      where: { date: verseDate },
      update: {
        verse: verse.trim(),
        reference: reference.trim()
      },
      create: {
        date: verseDate,
        verse: verse.trim(),
        reference: reference.trim()
      }
    })

    return NextResponse.json(dailyVerse)
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du verset:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}