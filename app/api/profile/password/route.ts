import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé ou mot de passe non défini' },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    // Hash du nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword }
    })

    return NextResponse.json({
      message: 'Mot de passe mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}