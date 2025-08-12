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
    const { nom, prenom, email, telephone, pays, ville, adresse, paroisse, role } = body

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: params.id
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé par un autre utilisateur' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        nom,
        prenom,
        email,
        telephone,
        pays,
        ville,
        adresse: adresse || null,
        paroisse: paroisse || null,
        role
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        pays: true,
        ville: true,
        adresse: true,
        paroisse: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
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

    // Empêcher la suppression de son propre compte
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    // Supprimer d'abord les dépendances selon le schéma Prisma
    // Les suppressions en cascade sont définies dans le schéma, mais on peut les faire explicitement pour plus de sécurité
    
    // Supprimer les progressions de contenu
    await prisma.contentProgress.deleteMany({
      where: { userId: params.id }
    })

    // Supprimer les progressions de chapitre  
    await prisma.chapterProgress.deleteMany({
      where: { userId: params.id }
    })

    // Supprimer les progressions de module
    await prisma.moduleProgress.deleteMany({
      where: { userId: params.id }
    })

    // Supprimer les résultats de quiz
    await prisma.quizResult.deleteMany({
      where: { userId: params.id }
    })

    // Supprimer les certificats
    await prisma.certificate.deleteMany({
      where: { userId: params.id }
    })

    // Supprimer les notifications personnelles (les notifications globales ont userId null)
    await prisma.notification.deleteMany({
      where: { userId: params.id }
    })

    // Supprimer les sessions et comptes (définis avec onDelete: Cascade dans le schéma)
    await prisma.session.deleteMany({
      where: { userId: params.id }
    })

    await prisma.account.deleteMany({
      where: { userId: params.id }
    })

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}