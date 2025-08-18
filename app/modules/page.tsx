'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, Clock, CheckCircle, Lock, BookOpen, Users, Award, Video, Headphones, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DailyVerse } from '@/components/daily-verse'
import { CertificatesSection } from '@/components/certificates-section'

interface Content {
  id: string
  title: string
  type: 'VIDEO' | 'AUDIO'
  duration: number
  order: number
  isCompleted?: boolean
  isUnlocked?: boolean
  progress?: number
  watchTime?: number
}

interface Quiz {
  id: string
  title: string
  passingScore: number
  isPassed?: boolean
}

interface Chapter {
  id: string
  title: string
  description: string
  order: number
  contents: Content[]
  isCompleted?: boolean
  isUnlocked?: boolean
  allContentsCompleted?: boolean
  quizPassed?: boolean
  quiz?: Quiz
}

interface Module {
  id: string
  title: string
  description: string
  thumbnail?: string
  order: number
  chapters: Chapter[]
  isCompleted?: boolean
  isUnlocked?: boolean
  progress?: number
  allChaptersCompleted?: boolean
}

interface UserStats {
  totalModules: number
  completedModules: number
  totalWatchTime: number
  averageScore: number
}

interface ApiResponse {
  success: boolean
  modules?: Module[]
  userStats?: UserStats
  message?: string
  emailNotVerified?: boolean
  error?: string
}

export default function ModulesPage() {
  const { data: session, status } = useSession()
  const [modules, setModules] = useState<Module[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'loading') return
    fetchModules()
  }, [status])

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules')
      if (!response.ok) {
        const errorData: ApiResponse = await response.json()
        if (errorData.emailNotVerified) {
          toast.error('Veuillez vérifier votre email avant d\'accéder aux modules')
          return
        }
        throw new Error(errorData.message || errorData.error || 'Erreur lors de la récupération des modules')
      }
      const data: ApiResponse = await response.json()
      if (data.success) {
        setModules(data.modules || [])
        setUserStats(data.userStats || null)
      } else {
        throw new Error(data.message || data.error || 'Erreur lors de la récupération des modules')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error)
      const errorMessage = error instanceof Error ? error.message : 'Impossible de charger les modules'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0min'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`
  }

  const formatWatchTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0min'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`
  }

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const getTotalModuleDuration = (module: Module): number => {
    if (!module?.chapters) return 0
    return module.chapters.reduce((total, chapter) => 
      total + (chapter?.contents || []).reduce((chapterTotal, content) => 
        chapterTotal + (content?.duration || 0), 0
      ), 0
    )
  }

  const getContentIcon = (type: string) => {
    return type === 'VIDEO' ? <Video className="w-4 h-4" /> : <Headphones className="w-4 h-4" />
  }

  const completionRate = userStats && userStats.totalModules > 0 
    ? Math.round((userStats.completedModules / userStats.totalModules) * 100) 
    : 0

  // Composant pour les modules en aperçu (visiteurs non connectés)
  const ModulePreview = ({ module }: { module: Module }) => (
    <Card key={module.id} className="opacity-75">
      <div className="relative">
        <img
          src={module.thumbnail || 'https://images.pexels.com/photos/2825806/pexels-photo-2825806.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={module.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="absolute top-4 right-4">
          <Badge variant="secondary">
            <Lock className="w-4 h-4 mr-1" />
            Connexion requise
          </Badge>
        </div>
      </div>
      <CardHeader>
        <Badge variant="outline" className="text-blue-600 w-fit">
          Module {module.order}
        </Badge>
        <CardTitle className="text-xl text-blue-900">
          {module.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4 line-clamp-3">
          {module.description}
        </p>
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <Clock className="w-4 h-4 mr-1" />
          {formatDuration(getTotalModuleDuration(module))}
        </div>
        <div className="text-sm text-gray-500">
          {module.chapters?.length || 0} chapitre{(module.chapters?.length || 0) > 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  )

  // États de chargement et d'authentification
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  // Page pour les utilisateurs non connectés
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center mb-8">
            <CardContent className="p-8">
              <BookOpen className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Accès Restreint</h2>
              <p className="text-gray-600 mb-6">
                Vous devez être connecté pour accéder aux modules de formation.
              </p>
              <div className="space-y-3">
                <Link href="/auth/signin">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="outline" className="w-full">
                    Créer un compte
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Aperçu des modules pour les visiteurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.slice(0, 6).map((module) => (
              <ModulePreview key={module.id} module={module} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Page principale pour les utilisateurs connectés
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Header />
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Verset du jour */}
          <div className="mb-8">
            <DailyVerse />
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">Modules de Formation</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Progressez à travers nos modules structurés pour une formation spirituelle complète. 
              Chaque contenu se débloque après validation du précédent.
            </p>
          </div>

          {/* Statistiques utilisateur */}
          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Modules Totaux</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.totalModules}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Complétés</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.completedModules}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Temps Total</p>
                      <p className="text-2xl font-bold text-gray-900">{formatWatchTime(userStats.totalWatchTime)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Score Moyen</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.averageScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Progression globale */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Progression Globale</h3>
                <Badge className="bg-orange-500">{completionRate}% Complété</Badge>
              </div>
              <Progress value={completionRate} className="h-3" />
              <p className="text-sm text-gray-600 mt-2">
                {userStats ? `${userStats.completedModules} sur ${userStats.totalModules} modules terminés` : 'Progression non disponible'}
              </p>
            </CardContent>
          </Card>

          {/* Modules avec affichage en grille 2x2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {modules.map((module) => (
              <Card key={module.id} className="overflow-hidden shadow-lg">
                <div className="relative">
                  <img
                    src={module.thumbnail || 'https://images.pexels.com/photos/2825806/pexels-photo-2825806.jpeg?auto=compress&cs=tinysrgb&w=800'}
                    alt={module.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-blue-900 backdrop-blur-sm">
                      Module {module.order}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    {module.isCompleted ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Terminé
                      </Badge>
                    ) : module.isUnlocked ? (
                      <Badge className="bg-orange-500">
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
                </div>

                <CardContent className="p-6">
                  {/* Titre et description du module */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-blue-900 mb-3">{module.title}</h2>
                    <p className="text-gray-600 leading-relaxed line-clamp-3">{module.description}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDuration(getTotalModuleDuration(module))}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {module.chapters?.length || 0} chapitre{(module.chapters?.length || 0) > 1 ? 's' : ''}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      {expandedModules.has(module.id) ? 'Réduire' : 'Voir les chapitres'}
                    </Button>
                  </div>

                  {typeof module.progress === 'number' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progression du module</span>
                        <span>{Math.round(module.progress)}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>
                  )}

                  {/* Chapitres */}
                  {expandedModules.has(module.id) && module.chapters && (
                    <div className="mt-6 space-y-4">
                      {module.chapters.map((chapter) => (
                        <Card key={chapter.id} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <Badge variant="outline" className="mb-2">
                                  Chapitre {chapter.order}
                                </Badge>
                                <CardTitle className="text-lg">{chapter.title}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{chapter.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {chapter.isCompleted ? (
                                  <Badge className="bg-green-500">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Terminé
                                  </Badge>
                                ) : chapter.isUnlocked ? (
                                  <Badge className="bg-orange-500">
                                    Disponible
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Verrouillé
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {/* Contenus du chapitre */}
                            {chapter.contents && (
                              <div className="space-y-2 mb-4">
                                {chapter.contents.map((content) => (
                                  <div 
                                    key={content.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                      content.isCompleted ? 'bg-green-50 border-green-200' :
                                      content.isUnlocked ? 'bg-blue-50 border-blue-200' :
                                      'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <div className={`p-2 rounded-full flex-shrink-0 ${
                                        content.isCompleted ? 'bg-green-500 text-white' :
                                        content.isUnlocked ? 'bg-blue-500 text-white' :
                                        'bg-gray-400 text-white'
                                      }`}>
                                        {getContentIcon(content.type)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h5 className="font-medium text-sm truncate">{content.title}</h5>
                                        <div className="flex items-center text-xs text-gray-500">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {formatDuration(content.duration)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                      {typeof content.progress === 'number' && content.progress > 0 && (
                                        <div className="text-xs text-gray-600">
                                          {Math.round(content.progress)}%
                                        </div>
                                      )}
                                      {content.isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : content.isUnlocked ? (
                                        <Link href={`/content/${content.id}`}>
                                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-xs px-2 py-1">
                                            {content.type === 'VIDEO' ? 'Regarder' : 'Écouter'}
                                          </Button>
                                        </Link>
                                      ) : (
                                        <Lock className="w-4 h-4 text-gray-400" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Quiz du chapitre */}
                            {chapter.quiz && (
                              <div className="border-t pt-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <HelpCircle className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium">Quiz de validation</span>
                                  </div>
                                  {chapter.allContentsCompleted ? (
                                    chapter.quizPassed ? (
                                      <Badge className="bg-green-500">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Réussi
                                      </Badge>
                                    ) : (
                                      <Link href={`/quiz/${chapter.quiz.id}`}>
                                        <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                                          Passer le quiz
                                        </Button>
                                      </Link>
                                    )
                                  ) : (
                                    <Badge variant="secondary">
                                      <Lock className="w-3 h-3 mr-1" />
                                      Quiz verrouillé
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Section des certificats */}
          <CertificatesSection />

          {/* Message si aucun module disponible */}
          {modules.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun module disponible</h3>
                <p className="text-gray-500">
                  Les modules de formation seront bientôt disponibles. Revenez plus tard !
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}