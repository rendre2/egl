import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    // Marquer la notification comme lue
    const notification = await prisma.notification.update({
      where: { 
        id: params.id,
        OR: [
          { userId: session.user.id },
          { userId: null } // Notifications globales
        ]
      },
      data: { isRead: true }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}