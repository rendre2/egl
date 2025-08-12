import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
// Route pour récupérer tous les modules 
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Vérifier si c'est un admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Récupérer tous les modules (actifs et inactifs) avec le compte de progression
    const modules = await prisma.module.findMany({
      orderBy: { order: 'asc' },
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
      modules,
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des modules:', error)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        success: false
      },
      { status: 500 }
    )
  }
}

// Route pour créer un nouveau module
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
    const { title, description, thumbnail, isActive } = body

    // Validation des données
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Les champs titre et description sont obligatoires' },
        { status: 400 }
      )
    }

    // Déterminer l'ordre du nouveau module
    const lastModule = await prisma.module.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const newOrder = (lastModule?.order || 0) + 1

    // Créer le nouveau module
    const module = await prisma.module.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnail?.trim() || null,
        isActive: Boolean(isActive),
        order: newOrder
      },
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
      message: 'Module créé avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la création du module:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du module',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        success: false
      },
      { status: 500 }
    )
  }
}