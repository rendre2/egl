'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Clock, CheckCircle, Lock } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

// Import des types depuis votre fichier types.ts
import type { Module, UserStats, ModulesApiResponse } from '@/lib/types'

export function FeaturedModules() {
  const { data: session } = useSession()
  const [modules, setModules] = useState<Module[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/modules')
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des modules')
        }
        const data: ModulesApiResponse = await response.json()
        
        if (data.success) {
          setModules(data.modules || [])
          setUserStats(data.userStats || null)
        } else {
          throw new Error(data.message || 'Erreur lors de la récupération des modules')
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement des modules:', error)
        toast.error(error.message || 'Impossible de charger les modules')
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [session])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')} min` : `${minutes} min`
  }

  // Calculer la durée totale d'un module basée sur ses chapitres et contenus
  const calculateModuleDuration = (module: Module): number => {
    if (!module.chapters) return 0
    return module.chapters.reduce((total, chapter) => {
      if (!chapter.contents) return total
      return total + chapter.contents.reduce((chapterTotal, content) => {
        return chapterTotal + content.duration
      }, 0)
    }, 0)
  }

  const displayedModules = showAll ? modules : modules.slice(0, 6)

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-4">
            Modules de Formation
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Progressez à travers nos modules structurés pour une formation spirituelle complète. 
            Chaque module se débloque après validation du précédent.
          </p>
          
          {/* Affichage des statistiques utilisateur */}
          {session && userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-2xl mx-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {userStats.completedModules}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Modules terminés</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {userStats.totalModules}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total modules</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.floor(userStats.totalWatchTime / 60)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Minutes regardées</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {userStats.averageScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Score moyen</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayedModules.map((module) => {
            const moduleDuration = calculateModuleDuration(module)
            
            return (
              <Card key={module.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                <div className="relative">
                  {module.thumbnail ? (
                    <img
                      src={module.thumbnail}
                      alt={module.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Image de fallback en cas d'erreur
                        e.currentTarget.src = '/images/default-module.jpg'
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Play className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-opacity duration-300" />
                  
                  <div className="absolute top-4 right-4">
                    {module.isCompleted ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Terminé
                      </Badge>
                    ) : module.isUnlocked ? (
                      <Badge className="bg-orange-500 hover:bg-orange-600">
                        <Play className="w-4 h-4 mr-1" />
                        Disponible
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Lock className="w-4 h-4 mr-1" />
                        Verrouillé
                      </Badge>
                    )}
                  </div>

                  {/* Barre de progression pour les utilisateurs connectés */}
                  {session && module.progress !== undefined && module.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-xl">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                      Module {module.order}
                    </Badge>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(moduleDuration)}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-blue-900 dark:text-blue-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {module.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {module.description}
                  </p>
                  
                  {/* Informations sur le contenu du module */}
                  {module.chapters && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {module.chapters.length} chapitre{module.chapters.length > 1 ? 's' : ''} • {' '}
                      {module.chapters.reduce((total, chapter) => 
                        total + (chapter.contents?.length || 0), 0
                      )} contenu{module.chapters.reduce((total, chapter) => 
                        total + (chapter.contents?.length || 0), 0
                      ) > 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {/* Affichage de la progression */}
                  {session && module.progress !== undefined && module.progress > 0 && !module.isCompleted && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progression</span>
                        <span>{module.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${module.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {session ? (
                    <Link href={module.isUnlocked ? `/modules/${module.id}` : '#'}>
                      <Button 
                        className={`w-full ${
                          module.isUnlocked 
                            ? 'bg-orange-500 hover:bg-orange-600' 
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!module.isUnlocked}
                      >
                        {module.isCompleted ? 'Revoir' : module.isUnlocked ? 'Commencer' : 'Verrouillé'}
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/auth/signup">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        S'inscrire pour accéder
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {modules.length > 6 && (
          <div className="text-center">
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              size="lg"
              className="border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-500 dark:hover:text-white"
            >
              {showAll ? 'Voir moins' : 'Voir plus de modules'}
            </Button>
          </div>
        )}

        {/* Message si aucun module disponible */}
        {modules.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              Aucun module disponible pour le moment
            </div>
            <p className="text-gray-400 dark:text-gray-500">
              Les modules de formation seront bientôt disponibles. Restez connecté !
            </p>
          </div>
        )}
      </div>
    </section>
  )
}