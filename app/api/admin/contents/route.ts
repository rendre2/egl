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

    const contents = await prisma.content.findMany({
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
        },
        _count: {
          select: {
            contentProgress: true
          }
        }
      },
      orderBy: [
        { chapter: { module: { order: 'asc' } } },
        { chapter: { order: 'asc' } },
        { order: 'asc' }
      ]
    })

    return NextResponse.json({ 
      contents,
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus:', error)
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
    const { chapterId, title, description, type, url, duration } = body

    if (!chapterId?.trim() || !title?.trim() || !type || !url?.trim() || !duration) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    if (!['VIDEO', 'AUDIO'].includes(type)) {
      return NextResponse.json(
        { error: 'Type de contenu invalide' },
        { status: 400 }
      )
    }

    if (duration <= 0) {
      return NextResponse.json(
        { error: 'La durée doit être supérieure à 0' },
        { status: 400 }
      )
    }

    // Vérifier que le chapitre existe
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true }
    })

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapitre introuvable' },
        { status: 404 }
      )
    }

    // Déterminer l'ordre du nouveau contenu
    const lastContent = await prisma.content.findFirst({
      where: { chapterId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const newOrder = (lastContent?.order || 0) + 1

    const content = await prisma.content.create({
      data: {
        chapterId,
        title: title.trim(),
        description: description?.trim() || null,
        type,
        url: url.trim(),
        duration: parseInt(duration),
        order: newOrder
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
      message: 'Contenu créé avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la création du contenu:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du contenu',
        success: false
      },
      { status: 500 }
    )
  }
}