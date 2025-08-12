import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les notifications de l'utilisateur et les notifications globales
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { userId: null } // Notifications globales
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error)
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
    const { title, content, type, userId } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Le titre et le contenu sont obligatoires' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type: type || 'INFO',
        userId: userId || null // null pour notification globale
      }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}