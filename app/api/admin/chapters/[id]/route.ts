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
    const { title, description } = body

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    const chapter = await prisma.chapter.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description.trim()
      },
      include: {
        module: {
          select: {
            title: true,
            order: true
          }
        },
        _count: {
          select: {
            contents: true
          }
        }
      }
    })

    return NextResponse.json({ 
      chapter,
      message: 'Chapitre mis à jour avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du chapitre:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour du chapitre',
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
        where: {
          content: {
            chapterId: params.id
          }
        }
      })

      // Supprimer les contenus
      await tx.content.deleteMany({
        where: { chapterId: params.id }
      })

      // Supprimer les résultats de quiz
      await tx.quizResult.deleteMany({
        where: {
          quiz: {
            chapterId: params.id
          }
        }
      })

      // Supprimer le quiz
      await tx.quiz.deleteMany({
        where: { chapterId: params.id }
      })

      // Supprimer les progressions de chapitre
      await tx.chapterProgress.deleteMany({
        where: { chapterId: params.id }
      })

      // Supprimer le chapitre
      await tx.chapter.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ 
      message: 'Chapitre supprimé avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du chapitre:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du chapitre',
        success: false
      },
      { status: 500 }
    )
  }
}