import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
// Fonction simple pour générer du CSV
function generateCSV(headers: string[], rows: any[][]): string {
  const csvRows = [headers, ...rows]
  return csvRows
    .map(row => 
      row.map(field => {
        const stringField = String(field || '')
        // Échapper les guillemets et entourer de guillemets si nécessaire
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`
        }
        return stringField
      }).join(',')
    )
    .join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'users':
        const users = await prisma.user.findMany({
          select: {
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
          },
          orderBy: { createdAt: 'desc' },
          take: 1000 // Limiter à 1000 pour la performance
        })

        csvContent = generateCSV(
          ['Nom', 'Prénom', 'Email', 'Téléphone', 'Pays', 'Ville', 'Adresse', 'Paroisse', 'Rôle', 'Date d\'inscription', 'Modules suivis'],
          users.map(user => [
            user.nom,
            user.prenom,
            user.email,
            user.telephone,
            user.pays,
            user.ville,
            user.adresse || '',
            user.paroisse || '',
            user.role,
            user.createdAt.toLocaleDateString('fr-FR'),
            user._count.moduleProgress
          ])
        )

        filename = 'utilisateurs.csv'
        break

      case 'modules':
        const modules = await prisma.module.findMany({
          include: {
            _count: {
              select: {
                moduleProgress: true
              }
            },
            chapters: {
              include: {
                contents: true
              }
            }
          },
          orderBy: { order: 'asc' },
          take: 100 // Limiter à 100 pour la performance
        })

        csvContent = generateCSV(
          ['Ordre', 'Titre', 'Description', 'Durée totale (min)', 'Nombre de chapitres', 'Nombre de contenus', 'Statut', 'Étudiants inscrits', 'Date de création'],
          modules.map(module => {
            const totalDuration = module.chapters.reduce((acc, chapter) => {
              return acc + chapter.contents.reduce((contentAcc, content) => contentAcc + content.duration, 0)
            }, 0)
            
            return [
              module.order,
              module.title,
              module.description,
              Math.floor(totalDuration / 60),
              module.chapters.length,
              module.chapters.reduce((acc, chapter) => acc + chapter.contents.length, 0),
              module.isActive ? 'Actif' : 'Inactif',
              module._count.moduleProgress,
              module.createdAt.toLocaleDateString('fr-FR')
            ]
          })
        )

        filename = 'modules.csv'
        break

      case 'progress':
        const progress = await prisma.contentProgress.findMany({
          include: {
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true
              }
            },
            content: {
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
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1000 // Limiter à 1000 pour la performance
        })

        csvContent = generateCSV(
          ['Utilisateur', 'Email', 'Module', 'Chapitre', 'Contenu', 'Temps regardé (min)', 'Progression (%)', 'Terminé', 'Date de complétion'],
          progress.map(p => [
            `${p.user.prenom} ${p.user.nom}`,
            p.user.email,
            `Module ${p.content.chapter.module.order}: ${p.content.chapter.module.title}`,
            p.content.chapter.title,
            p.content.title,
            Math.floor(p.watchTime / 60),
            Math.round((p.watchTime / p.content.duration) * 100),
            p.isCompleted ? 'Oui' : 'Non',
            p.completedAt ? p.completedAt.toLocaleDateString('fr-FR') : ''
          ])
        )

        filename = 'progression.csv'
        break

      case 'quiz-results':
        const quizResults = await prisma.quizResult.findMany({
          include: {
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true
              }
            },
            quiz: {
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
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1000 // Limiter à 1000 pour la performance
        })

        csvContent = generateCSV(
          ['Utilisateur', 'Email', 'Module', 'Chapitre', 'Quiz', 'Score (%)', 'Réussi', 'Date'],
          quizResults.map(result => [
            `${result.user.prenom} ${result.user.nom}`,
            result.user.email,
            `Module ${result.quiz.chapter.module.order}: ${result.quiz.chapter.module.title}`,
            result.quiz.chapter.title,
            result.quiz.title,
            result.score,
            result.passed ? 'Oui' : 'Non',
            result.createdAt.toLocaleDateString('fr-FR')
          ])
        )

        filename = 'resultats-quiz.csv'
        break

      case 'certificates':
        const certificates = await prisma.certificate.findMany({
          include: {
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true
              }
            },
            module: {
              select: {
                title: true,
                order: true
              }
            }
          },
          orderBy: { issuedAt: 'desc' },
          take: 1000
        })

        csvContent = generateCSV(
          ['Utilisateur', 'Email', 'Module', 'Type de certificat', 'Numéro de certificat', 'Date d\'émission'],
          certificates.map(cert => [
            `${cert.user.prenom} ${cert.user.nom}`,
            cert.user.email,
            `Module ${cert.module.order}: ${cert.module.title}`,
            cert.type,
            cert.certificateNumber,
            cert.issuedAt.toLocaleDateString('fr-FR')
          ])
        )

        filename = 'certificats.csv'
        break

      default:
        return NextResponse.json(
          { error: 'Type d\'export non supporté' },
          { status: 400 }
        )
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Erreur lors de l\'export:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}