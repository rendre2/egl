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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, type, url, duration } = body

    if (!title?.trim() || !url?.trim() || !duration || duration <= 0) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    if (!['VIDEO', 'AUDIO'].includes(type)) {
      return NextResponse.json(
        { error: 'Type de contenu invalide' },
        { status: 400 }
      )
    }

    const content = await prisma.content.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type,
        url: url.trim(),
        duration: parseInt(duration)
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
        }
      }
    })

    return NextResponse.json({ 
      content,
      message: 'Contenu mis à jour avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contenu:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour du contenu',
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

    // Supprimer en cascade
    await prisma.$transaction(async (tx) => {
      // Supprimer les progressions de contenu
      await tx.contentProgress.deleteMany({
        where: { contentId: params.id }
      })

      // Supprimer le contenu
      await tx.content.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ 
      message: 'Contenu supprimé avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du contenu:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du contenu',
        success: false
      },
      { status: 500 }
    )
  }
}