import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const chapters = await prisma.chapter.findMany({
      include: {
        module: {
          select: {
            title: true,
            order: true
          }
        },
        contents: {
          select: {
            id: true,
            title: true,
            type: true,
            duration: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true
          }
        },
        _count: {
          select: {
            contents: true,
            chapterProgress: true
          }
        }
      },
      orderBy: [
        { module: { order: 'asc' } },
        { order: 'asc' }
      ]
    })

    return NextResponse.json({ 
      chapters,
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des chapitres:', error)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
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
    const { moduleId, title, description } = body

    if (!moduleId?.trim() || !title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier que le module existe
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true }
    })

    if (!module) {
      return NextResponse.json(
        { error: 'Module introuvable' },
        { status: 404 }
      )
    }

    // Déterminer l'ordre du nouveau chapitre
    const lastChapter = await prisma.chapter.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const newOrder = (lastChapter?.order || 0) + 1

    const chapter = await prisma.chapter.create({
      data: {
        moduleId,
        title: title.trim(),
        description: description.trim(),
        order: newOrder
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
      message: 'Chapitre créé avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la création du chapitre:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du chapitre',
        success: false
      },
      { status: 500 }
    )
  }
}