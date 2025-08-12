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
    const { title, description, thumbnail, isActive } = body

    // Validation des données si présentes
    if (title !== undefined && !title?.trim()) {
      return NextResponse.json(
        { error: 'Le titre ne peut pas être vide' },
        { status: 400 }
      )
    }

    if (description !== undefined && !description?.trim()) {
      return NextResponse.json(
        { error: 'La description ne peut pas être vide' },
        { status: 400 }
      )
    }

    // Construire l'objet de mise à jour
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail?.trim() || null
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const module = await prisma.module.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        order: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            moduleProgress: true,
            chapters: true
          }
        }
      }
    })

    return NextResponse.json({ 
      module,
      message: 'Module mis à jour avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du module:', error)
    
    // Gestion spécifique de l'erreur "module not found"
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Module non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour du module',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
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

    // Vérifier si le module existe
    const existingModule = await prisma.module.findUnique({
      where: { id: params.id },
      select: { id: true }
    })

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Module non trouvé' },
        { status: 404 }
      )
    }

    // Utilisation d'une transaction pour supprimer toutes les dépendances
    await prisma.$transaction(async (tx) => {
      // Supprimer les progressions de contenu liées aux chapitres du module
      await tx.contentProgress.deleteMany({
        where: {
          content: {
            chapter: {
              moduleId: params.id
            }
          }
        }
      })

      // Supprimer les résultats de quiz liés aux chapitres du module
      await tx.quizResult.deleteMany({
        where: {
          quiz: {
            chapter: {
              moduleId: params.id
            }
          }
        }
      })

      // Supprimer les quiz liés aux chapitres du module
      await tx.quiz.deleteMany({
        where: {
          chapter: {
            moduleId: params.id
          }
        }
      })

      // Supprimer les contenus liés aux chapitres du module
      await tx.content.deleteMany({
        where: {
          chapter: {
            moduleId: params.id
          }
        }
      })

      // Supprimer les progressions de chapitre
      await tx.chapterProgress.deleteMany({
        where: {
          chapter: {
            moduleId: params.id
          }
        }
      })

      // Supprimer les chapitres du module
      await tx.chapter.deleteMany({
        where: { moduleId: params.id }
      })

      // Supprimer les progressions du module
      await tx.moduleProgress.deleteMany({
        where: { moduleId: params.id }
      })

      // Supprimer les certificats liés au module
      await tx.certificate.deleteMany({
        where: { moduleId: params.id }
      })

      // Supprimer le module
      await tx.module.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ 
      message: 'Module supprimé avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du module:', error)
    
    // Gestion spécifique de l'erreur "module not found"
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Module non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du module',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}