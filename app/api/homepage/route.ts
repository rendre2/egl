import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Récupérer les données de la page d'accueil
    const homepage = await prisma.homePage.findFirst()

    if (!homepage) {
      return NextResponse.json({
        homepage: null,
        stats: {
          totalUsers: 0,
          totalModules: 0,
          successRate: 0
        }
      })
    }

    // Récupérer les statistiques
    const totalUsers = await prisma.user.count()
    const totalModules = await prisma.module.count({ where: { isActive: true } })
    
    // Correction: utiliser moduleProgress au lieu de userProgress
    const completedModules = await prisma.moduleProgress.count({ 
      where: { isCompleted: true } 
    })
    
    const successRate = totalUsers > 0 && totalModules > 0
      ? Math.round((completedModules / (totalUsers * totalModules)) * 100)
      : 0

    return NextResponse.json({
      homepage,
      stats: {
        totalUsers,
        totalModules,
        successRate
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des données de la page d\'accueil:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de la récupération des données' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      heroTitle, 
      heroSubtitle, 
      heroImage, 
      featuredModules, 
      testimonials, 
      announcements,
      testimonialsTitle,
      testimonialsSubtitle,
      ctaTitle,
      ctaSubtitle
    } = body

    // Validation des données
    if (!heroTitle || typeof heroTitle !== 'string') {
      return NextResponse.json(
        { error: 'Le titre principal est requis et doit être une chaîne de caractères' },
        { status: 400 }
      )
    }
    if (!heroSubtitle || typeof heroSubtitle !== 'string') {
      return NextResponse.json(
        { error: 'Le sous-titre est requis et doit être une chaîne de caractères' },
        { status: 400 }
      )
    }
    if (heroImage && !isValidUrl(heroImage)) {
      return NextResponse.json(
        { error: 'L\'URL de l\'image doit être valide' },
        { status: 400 }
      )
    }
    if (!Array.isArray(featuredModules)) {
      return NextResponse.json(
        { error: 'Les modules mis en avant doivent être un tableau' },
        { status: 400 }
      )
    }
    if (!Array.isArray(testimonials) || !testimonials.every(isValidTestimonial)) {
      return NextResponse.json(
        { error: 'Les témoignages doivent être un tableau de témoignages valides' },
        { status: 400 }
      )
    }
    if (!Array.isArray(announcements) || !announcements.every(isValidAnnouncement)) {
      return NextResponse.json(
        { error: 'Les annonces doivent être un tableau d\'annonces valides' },
        { status: 400 }
      )
    }

    // Vérifier si un enregistrement existe déjà
    const existingHomepage = await prisma.homePage.findFirst()

    // Si aucune homepage n'existe, créer une avec les valeurs par défaut
    if (!existingHomepage) {
      const defaultHomepage = await prisma.homePage.create({
        data: {
          id: 'default',
          heroTitle: heroTitle || "Notre proposition",
          heroSubtitle: heroSubtitle || "Bienvenue dans le domaine d'Israël chrétien dédié à l'enseignement spirituel et à l'édification communautaire !",
          heroImage: heroImage || "https://images.pexels.com/photos/1000445/pexels-photo-1000445.jpeg?auto=compress&cs=tinysrgb&w=1200",
          featuredModules: JSON.stringify(featuredModules || []),
          testimonials: JSON.stringify(testimonials || []),
          announcements: JSON.stringify(announcements || []),
          testimonialsTitle: testimonialsTitle || "Témoignages de nos Étudiants",
          testimonialsSubtitle: testimonialsSubtitle || "Découvrez comment notre formation spirituelle a impacté la vie de nos frères et sœurs",
          ctaTitle: ctaTitle || "Rejoignez notre Communauté",
          ctaSubtitle: ctaSubtitle || "Commencez votre parcours de formation spirituelle dès aujourd'hui et grandissez avec nous dans la foi.",
        }
      })
      
      return NextResponse.json({ 
        homepage: defaultHomepage,
        message: 'Page d\'accueil créée avec succès',
        success: true
      })
    }

    const homepage = await prisma.homePage.upsert({
      where: { 
        id: existingHomepage?.id || 'default'
      },
      update: {
        heroTitle,
        heroSubtitle,
        heroImage,
        featuredModules: JSON.stringify(featuredModules), // Conversion en JSON
        testimonials: JSON.stringify(testimonials), // Conversion en JSON
        announcements: JSON.stringify(announcements), // Conversion en JSON
        testimonialsTitle: testimonialsTitle || "Témoignages de nos Étudiants",
        testimonialsSubtitle: testimonialsSubtitle || "Découvrez comment notre formation spirituelle a impacté la vie de nos frères et sœurs",
        ctaTitle: ctaTitle || "Rejoignez notre Communauté",
        ctaSubtitle: ctaSubtitle || "Commencez votre parcours de formation spirituelle dès aujourd'hui et grandissez avec nous dans la foi.",
      },
      create: {
        id: 'default',
        heroTitle,
        heroSubtitle,
        heroImage,
        featuredModules: JSON.stringify(featuredModules), // Conversion en JSON
        testimonials: JSON.stringify(testimonials), // Conversion en JSON
        announcements: JSON.stringify(announcements), // Conversion en JSON
        testimonialsTitle: testimonialsTitle || "Témoignages de nos Étudiants",
        testimonialsSubtitle: testimonialsSubtitle || "Découvrez comment notre formation spirituelle a impacté la vie de nos frères et sœurs",
        ctaTitle: ctaTitle || "Rejoignez notre Communauté",
        ctaSubtitle: ctaSubtitle || "Commencez votre parcours de formation spirituelle dès aujourd'hui et grandissez avec nous dans la foi.",
      }
    })

    return NextResponse.json({ 
      homepage,
      message: 'Page d\'accueil mise à jour avec succès',
      success: true
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la page d\'accueil:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de la mise à jour des données' },
      { status: 500 }
    )
  }
}

// Fonctions de validation
function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isValidTestimonial(testimonial: any) {
  return (
    typeof testimonial === 'object' &&
    testimonial !== null &&
    typeof testimonial.id === 'string' &&
    typeof testimonial.name === 'string' &&
    testimonial.name.trim() !== '' &&
    typeof testimonial.location === 'string' &&
    testimonial.location.trim() !== '' &&
    typeof testimonial.content === 'string' &&
    testimonial.content.trim() !== '' &&
    typeof testimonial.rating === 'number' &&
    testimonial.rating >= 1 &&
    testimonial.rating <= 5 &&
    (typeof testimonial.avatar === 'string')
  )
}

function isValidAnnouncement(announcement: any) {
  return (
    typeof announcement === 'object' &&
    announcement !== null &&
    typeof announcement.id === 'string' &&
    typeof announcement.title === 'string' &&
    announcement.title.trim() !== '' &&
    typeof announcement.content === 'string' &&
    announcement.content.trim() !== '' &&
    ['info', 'warning', 'success'].includes(announcement.type) &&
    typeof announcement.date === 'string' &&
    !isNaN(Date.parse(announcement.date))
  )
}