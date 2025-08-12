import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
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
        createdAt: true,
        emailVerified: true,
        _count: {
          select: {
            moduleProgress: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Validation des champs obligatoires
    if (!nom?.trim() || !prenom?.trim() || !email?.trim() || !telephone?.trim() || !pays?.trim() || !ville?.trim()) {
      return NextResponse.json(
        { error: 'Les champs nom, prénom, email, téléphone, pays et ville sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Créer l'utilisateur avec un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const user = await prisma.user.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        telephone: telephone.trim(),
        pays: pays.trim(),
        ville: ville.trim(),
        adresse: adresse?.trim() || null,
        paroisse: paroisse?.trim() || null,
        role: role || 'USER',
        password: hashedPassword,
        emailVerified: new Date() // Auto-vérifier pour les comptes créés par admin
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
        createdAt: true,
        _count: {
          select: {
            moduleProgress: true
          }
        }
      }
    })

    return NextResponse.json({ 
      user,
      tempPassword,
      message: 'Utilisateur créé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}