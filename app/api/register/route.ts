import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom, prenom, telephone, email, password, pays, ville, adresse, paroisse } = body

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Générer un token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 heures

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        nom,
        prenom,
        telephone,
        email,
        password: hashedPassword,
        pays,
        ville,
        adresse: adresse || null,
        paroisse: paroisse || null,
        emailVerified: null, // Explicitement null jusqu'à vérification
      }
    })

    // Créer le token de vérification
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: verificationTokenExpiry
      }
    })

    // Envoyer l'email de vérification
    let emailSent = false
    try {
      await sendVerificationEmail(email, `${prenom} ${nom}`, verificationToken)
      emailSent = true
      console.log('Email de vérification envoyé avec succès à:', email)
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de vérification:', emailError)
      // Log l'erreur mais ne pas faire échouer l'inscription
    }

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: emailSent 
          ? 'Inscription réussie ! Vérifiez votre email pour activer votre compte.'
          : 'Inscription réussie ! Vous pouvez vous connecter maintenant.',
        user: userWithoutPassword,
        emailSent
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}