import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic'
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { watchTime, isCompleted } = body;

    // Validation des données
    if (typeof watchTime !== 'number' || watchTime < 0) {
      return NextResponse.json(
        { error: 'Temps de visionnage invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le contenu existe et est actif
    const content = await prisma.content.findUnique({
      where: { 
        id: params.id,
        isActive: true 
      },
      select: { 
        id: true, 
        duration: true,
        order: true,
        chapter: {
          select: {
            id: true,
            title: true,
            order: true,
            module: {
              select: {
                id: true,
                title: true,
                order: true
              }
            }
          }
        }
      }
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Contenu non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le contenu est débloqué pour cet utilisateur
    const allContents = await prisma.content.findMany({
      where: { 
        isActive: true,
        chapter: {
          isActive: true,
          module: {
            isActive: true
          }
        }
      },
      orderBy: [
        { chapter: { module: { order: 'asc' } } },
        { chapter: { order: 'asc' } },
        { order: 'asc' }
      ],
      select: { 
        id: true, 
        order: true,
        chapter: {
          select: {
            id: true,
            order: true,
            module: {
              select: {
                id: true,
                order: true
              }
            }
          }
        }
      },
    });

    const currentIndex = allContents.findIndex(c => c.id === params.id);
    const isFirstContent = currentIndex === 0;
    let isUnlocked = isFirstContent;

    if (!isFirstContent && currentIndex > 0) {
      const previousContent = allContents[currentIndex - 1];
      const previousContentProgress = await prisma.contentProgress.findFirst({
        where: { 
          contentId: previousContent.id, 
          userId: session.user.id, 
          isCompleted: true 
        },
      });
      isUnlocked = !!previousContentProgress;
    }

    if (!isUnlocked) {
      return NextResponse.json(
        { error: 'Contenu verrouillé - Vous devez terminer le contenu précédent' },
        { status: 403 }
      );
    }

    // Limiter le temps de visionnage à la durée du contenu
    const clampedWatchTime = Math.min(watchTime, content.duration);
    
    // Déterminer si le contenu est complété (90% ou plus)
    const progressPercentage = (clampedWatchTime / content.duration) * 100;
    const autoCompleted = progressPercentage >= 90;
    const finalIsCompleted = isCompleted || autoCompleted;

    // Créer ou mettre à jour la progression du contenu
    const contentProgress = await prisma.contentProgress.upsert({
      where: {
        userId_contentId: {
          userId: session.user.id,
          contentId: params.id
        }
      },
      update: {
        watchTime: clampedWatchTime,
        isCompleted: finalIsCompleted,
        completedAt: finalIsCompleted ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        contentId: params.id,
        watchTime: clampedWatchTime,
        isCompleted: finalIsCompleted,
        completedAt: finalIsCompleted ? new Date() : null
      },
      select: {
        watchTime: true,
        isCompleted: true,
        completedAt: true
      }
    });

    // Si le contenu est terminé, vérifier et mettre à jour la progression du chapitre
    if (finalIsCompleted) {
      await updateChapterProgress(session.user.id, content.chapter.id);
    }

    // Calculer le pourcentage de progression
    const finalProgressPercentage = Math.min(100, Math.round((clampedWatchTime / content.duration) * 100));

    return NextResponse.json({
      success: true,
      data: {
        watchTime: contentProgress.watchTime,
        isCompleted: contentProgress.isCompleted,
        completedAt: contentProgress.completedAt,
        progress: finalProgressPercentage,
        contentId: params.id,
        chapterInfo: {
          id: content.chapter.id,
          title: content.chapter.title
        },
        moduleInfo: {
          id: content.chapter.module.id,
          title: content.chapter.module.title
        }
      },
      message: finalIsCompleted ? 'Contenu terminé avec succès !' : 'Progression mise à jour'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        success: false
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer la progression de l'utilisateur pour ce contenu
    const contentProgress = await prisma.contentProgress.findUnique({
      where: {
        userId_contentId: {
          userId: session.user.id,
          contentId: params.id
        }
      },
      select: {
        watchTime: true,
        isCompleted: true,
        completedAt: true,
        updatedAt: true,
        content: {
          select: {
            duration: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
                module: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!contentProgress) {
      // Si pas de progression, récupérer les infos du contenu
      const content = await prisma.content.findUnique({
        where: { id: params.id },
        select: {
          duration: true,
          title: true,
          chapter: {
            select: {
              id: true,
              title: true,
              module: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          watchTime: 0,
          isCompleted: false,
          completedAt: null,
          progress: 0,
          contentId: params.id,
          contentInfo: content ? {
            title: content.title,
            duration: content.duration
          } : null,
          chapterInfo: content ? {
            id: content.chapter.id,
            title: content.chapter.title
          } : null,
          moduleInfo: content ? {
            id: content.chapter.module.id,
            title: content.chapter.module.title
          } : null
        }
      });
    }

    // Calculer le pourcentage de progression
    const progressPercentage = contentProgress.content.duration > 0 
      ? Math.min(100, Math.round((contentProgress.watchTime / contentProgress.content.duration) * 100))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        watchTime: contentProgress.watchTime,
        isCompleted: contentProgress.isCompleted,
        completedAt: contentProgress.completedAt,
        progress: progressPercentage,
        contentId: params.id,
        lastUpdated: contentProgress.updatedAt,
        contentInfo: {
          title: contentProgress.content.title,
          duration: contentProgress.content.duration
        },
        chapterInfo: {
          id: contentProgress.content.chapter.id,
          title: contentProgress.content.chapter.title
        },
        moduleInfo: {
          id: contentProgress.content.chapter.module.id,
          title: contentProgress.content.chapter.module.title
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la progression:', error);
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        success: false
      },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour mettre à jour la progression du chapitre
async function updateChapterProgress(userId: string, chapterId: string) {
  try {
    // Récupérer tous les contenus du chapitre
    const chapterContents = await prisma.content.findMany({
      where: { 
        chapterId,
        isActive: true 
      },
      select: { id: true }
    });

    // Vérifier combien de contenus sont terminés
    const completedContents = await prisma.contentProgress.findMany({
      where: {
        userId,
        contentId: { in: chapterContents.map(c => c.id) },
        isCompleted: true
      }
    });

    // Si tous les contenus sont terminés, marquer le chapitre comme terminé
    const allContentsCompleted = completedContents.length === chapterContents.length;

    if (allContentsCompleted) {
      await prisma.chapterProgress.upsert({
        where: {
          userId_chapterId: {
            userId,
            chapterId
          }
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          userId,
          chapterId,
          isCompleted: true,
          completedAt: new Date()
        }
      });

      // Vérifier et mettre à jour la progression du module
      await updateModuleProgress(userId, chapterId);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression du chapitre:', error);
  }
}

// Fonction utilitaire pour mettre à jour la progression du module
async function updateModuleProgress(userId: string, chapterId: string) {
  try {
    // Récupérer le module du chapitre
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { moduleId: true }
    });

    if (!chapter) return;

    // Récupérer tous les chapitres du module
    const moduleChapters = await prisma.chapter.findMany({
      where: { 
        moduleId: chapter.moduleId,
        isActive: true 
      },
      select: { id: true }
    });

    // Vérifier combien de chapitres sont terminés
    const completedChapters = await prisma.chapterProgress.findMany({
      where: {
        userId,
        chapterId: { in: moduleChapters.map(c => c.id) },
        isCompleted: true
      }
    });

    // Si tous les chapitres sont terminés, marquer le module comme terminé
    const allChaptersCompleted = completedChapters.length === moduleChapters.length;

    if (allChaptersCompleted) {
      await prisma.moduleProgress.upsert({
        where: {
          userId_moduleId: {
            userId,
            moduleId: chapter.moduleId
          }
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          userId,
          moduleId: chapter.moduleId,
          isCompleted: true,
          completedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression du module:', error);
  }
}