import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email } = body

    // Vérifier si le token existe et n'est pas expiré
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: token,
        expires: {
          gt: new Date()
        }
      }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Token valide' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}