import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Toujours retourner un succès pour des raisons de sécurité
    // (ne pas révéler si l'email existe ou non)
    if (!user) {
      return NextResponse.json(
        { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' },
        { status: 200 }
      )
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 heure

    // Sauvegarder le token dans la base de données
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: resetTokenExpiry
      }
    })

    // TODO: Envoyer l'email de réinitialisation
    // Pour l'instant, on log le token (à remplacer par un vrai service d'email)
    try {
      await sendPasswordResetEmail(email, `${user.prenom} ${user.nom}`, resetToken)
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', emailError)
      // Ne pas révéler l'erreur pour des raisons de sécurité
    }

    return NextResponse.json(
      { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}