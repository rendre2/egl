import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les certificats de l'utilisateur
    const certificates = await prisma.certificate.findMany({
      where: { userId: session.user.id },
      include: {
        module: {
          select: {
            title: true,
            order: true
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    })

    // Vérifier les certificats éligibles
    const completedModules = await prisma.moduleProgress.count({
      where: {
        userId: session.user.id,
        isCompleted: true
      }
    })

    const eligibleCertificates = []
    
    if (completedModules >= 3) {
      const hasBronze = certificates.some(c => c.type === 'BRONZE')
      if (!hasBronze) {
        eligibleCertificates.push({ type: 'BRONZE', requiredModules: 3 })
      }
    }
    
    if (completedModules >= 6) {
      const hasSilver = certificates.some(c => c.type === 'SILVER')
      if (!hasSilver) {
        eligibleCertificates.push({ type: 'SILVER', requiredModules: 6 })
      }
    }
    
    if (completedModules >= 9) {
      const hasGold = certificates.some(c => c.type === 'GOLD')
      if (!hasGold) {
        eligibleCertificates.push({ type: 'GOLD', requiredModules: 9 })
      }
    }

    return NextResponse.json({ 
      certificates,
      eligibleCertificates,
      completedModules
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des certificats:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type } = body

    if (!['BRONZE', 'SILVER', 'GOLD'].includes(type)) {
      return NextResponse.json(
        { error: 'Type de certificat invalide' },
        { status: 400 }
      )
    }

    // Vérifier l'éligibilité
    const completedModules = await prisma.moduleProgress.count({
      where: {
        userId: session.user.id,
        isCompleted: true
      }
    })

    const requiredModules = type === 'BRONZE' ? 3 : type === 'SILVER' ? 6 : 9
    
    if (completedModules < requiredModules) {
      return NextResponse.json(
        { error: `Vous devez compléter ${requiredModules} modules pour obtenir ce certificat` },
        { status: 400 }
      )
    }

    // Vérifier si le certificat n'existe pas déjà
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        userId: session.user.id,
        type: type
      }
    })

    if (existingCertificate) {
      return NextResponse.json(
        { error: 'Vous avez déjà obtenu ce certificat' },
        { status: 400 }
      )
    }

    // Générer un numéro de certificat unique
    const certificateNumber = `EC-${type}-${Date.now()}-${session.user.id.slice(-4)}`

    // Récupérer le dernier module complété pour l'associer au certificat
    const lastCompletedModule = await prisma.moduleProgress.findFirst({
      where: {
        userId: session.user.id,
        isCompleted: true
      },
      include: {
        module: true
      },
      orderBy: { completedAt: 'desc' }
    })

    if (!lastCompletedModule) {
      return NextResponse.json(
        { error: 'Aucun module complété trouvé' },
        { status: 400 }
      )
    }

    // Créer le certificat
    const certificate = await prisma.certificate.create({
      data: {
        userId: session.user.id,
        moduleId: lastCompletedModule.moduleId,
        type: type,
        certificateNumber
      },
      include: {
        module: {
          select: {
            title: true,
            order: true
          }
        }
      }
    })

    return NextResponse.json(certificate)
  } catch (error) {
    console.error('Erreur lors de la création du certificat:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}