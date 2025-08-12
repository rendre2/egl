'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Maximize, 
  CheckCircle, 
  Clock,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Award,
  Lock
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface QuizResult {
  score: number
  passed: boolean
  createdAt: string
}

interface Quiz {
  id: string
  title: string
  passingScore: number
  userResult?: QuizResult
}

interface NavigationModule {
  id: string
  order: number
  unlocked?: boolean
}

interface Navigation {
  previous: NavigationModule | null
  next: NavigationModule | null
}

interface Module {
  id: string
  title: string
  description: string
  videoUrl: string
  duration: number
  order: number
  content?: string
  objectives?: string[]
  progress: number
  isCompleted: boolean
  watchTime: number
  quiz?: Quiz
  navigation: Navigation
}

interface ApiResponse {
  success: boolean
  message?: string
}

interface ModuleResponse extends Module, ApiResponse {}

export default function ModuleDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [localProgress, setLocalProgress] = useState(0)
  const [updateInProgress, setUpdateInProgress] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null)

  // Redirection si non connecté
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Fonction pour mettre à jour la progression (memoized)
  const updateProgress = useCallback(async (watchTime: number, isCompleted: boolean = false) => {
    if (updateInProgress || !module || !params.id) return
    
    setUpdateInProgress(true)
    try {
      const response = await fetch(`/api/user-progress/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          watchTime: Math.floor(watchTime), 
          isCompleted 
        })
      })
      
      if (!response.ok) {
        console.error('Erreur lors de la mise à jour de la progression')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error)
    } finally {
      setUpdateInProgress(false)
    }
  }, [updateInProgress, module, params.id])

  // Charger les données du module
  useEffect(() => {
    if (session && params.id) {
      const fetchModule = async () => {
        try {
          const response = await fetch(`/api/modules/${params.id}`)
          if (!response.ok) {
            const errorData: ApiResponse = await response.json()
            throw new Error(errorData.message || 'Erreur lors de la récupération du module')
          }
          const data: ModuleResponse = await response.json()
          if (data.success) {
            setModule(data)
            setLocalProgress(data.progress || 0)
          } else {
            throw new Error(data.message || 'Erreur lors de la récupération du module')
          }
        } catch (error) {
          console.error('Erreur lors du chargement du module:', error)
          const errorMessage = error instanceof Error ? error.message : 'Impossible de charger le module'
          toast.error(errorMessage)
          router.push('/modules')
        } finally {
          setLoading(false)
        }
      }
      fetchModule()
    }
  }, [session, params.id, router])

  // Gestion du lecteur vidéo
  useEffect(() => {
    const video = videoRef.current
    if (!video || !module) return

    const updateTime = () => {
      const current = video.currentTime
      setCurrentTime(current)
      
      if (video.duration > 0) {
        const progress = (current / video.duration) * 100
        setLocalProgress(progress)
        
        // Marquer comme complété à 90%
        if (progress >= 90 && !module.isCompleted) {
          setModule(prev => prev ? { ...prev, isCompleted: true } : null)
          updateProgress(current, true)
          toast.success('Module terminé ! Vous pouvez maintenant passer au quiz.')
        }
      }
    }

    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration)
        // Reprendre là où l'utilisateur s'était arrêté
        if (module.watchTime > 0 && module.watchTime < video.duration) {
          video.currentTime = module.watchTime
        }
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    
    const handleError = (e: Event) => {
      console.error('Erreur de lecture vidéo:', e)
      toast.error('Erreur lors de la lecture de la vidéo')
    }

    const handleLoadStart = () => {
      setLoading(true)
    }

    const handleCanPlay = () => {
      setLoading(false)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)

    // Mise à jour périodique de la progression
    if (progressUpdateInterval.current) {
      clearInterval(progressUpdateInterval.current)
    }
    
    progressUpdateInterval.current = setInterval(() => {
      if (isPlaying && video.currentTime > 0) {
        updateProgress(video.currentTime)
      }
    }, 10000) // Toutes les 10 secondes

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current)
      }
      
      // Sauvegarder la progression avant de quitter
      if (video.currentTime > 0) {
        updateProgress(video.currentTime, localProgress >= 90)
      }
    }
  }, [module, isPlaying, localProgress, updateProgress])

  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0 min'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')} min` : `${minutes} min`
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Erreur lors de la lecture:', error)
          toast.error('Impossible de lire la vidéo')
        })
      }
    }
  }

  const handleSeek = (seconds: number) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    
    const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
    video.currentTime = newTime
  }

  const formatTime = (time: number): string => {
    if (isNaN(time) || !isFinite(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !video.duration) return

    const rect = event.currentTarget.getBoundingClientRect()
    const clickPosition = (event.clientX - rect.left) / rect.width
    const newTime = clickPosition * video.duration
    video.currentTime = newTime
  }

  const handleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (video.requestFullscreen) {
      video.requestFullscreen()
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen()
    } else if ((video as any).msRequestFullscreen) {
      (video as any).msRequestFullscreen()
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Module non trouvé</h2>
          <Link href="/modules">
            <Button>Retour aux modules</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/modules"
            className="flex items-center text-blue-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux modules
          </Link>
          <Badge variant="outline" className="text-blue-600">
            Module {module.order}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden shadow-xl">
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  src={module.videoUrl}
                  className="w-full aspect-video"
                  preload="metadata"
                  onError={(e) => {
                    console.error('Erreur vidéo:', e)
                    toast.error('Impossible de charger la vidéo')
                  }}
                />
                
                {/* Contrôles vidéo personnalisés */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="space-y-2">
                    {/* Barre de progression cliquable */}
                    <div 
                      className="w-full h-2 bg-white/20 rounded-full cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                    
                    {/* Contrôles */}
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={togglePlay}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSeek(-10)}
                          className="text-white hover:bg-white/20"
                        >
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSeek(10)}
                          className="text-white hover:bg-white/20"
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>

                        <div className="flex items-center space-x-2 text-sm">
                          <span>{formatTime(currentTime)}</span>
                          <span>/</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                        >
                          <Volume2 className="w-5 h-5" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleFullscreen}
                          className="text-white hover:bg-white/20"
                        >
                          <Maximize className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-500" />
                  Progression du Module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span className="font-semibold">{Math.round(localProgress)}%</span>
                  </div>
                  <Progress value={localProgress} className="h-3" />
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Temps regardé: {formatTime(currentTime)}</span>
                    <span>Durée totale: {formatTime(duration)}</span>
                  </div>
                  
                  {module.isCompleted && (
                    <div className="flex items-center text-green-600 font-semibold">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Module terminé ! {module.quiz ? 'Passez au quiz pour débloquer le suivant.' : 'Module validé !'}
                    </div>
                  )}

                  {module.quiz?.userResult && (
                    <div className={`flex items-center font-semibold ${module.quiz.userResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                      <Award className="w-5 h-5 mr-2" />
                      Quiz {module.quiz.userResult.passed ? 'réussi' : 'échoué'} : {module.quiz.userResult.score}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-blue-900">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {module.description}
                </p>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(module.duration)}
                </div>

                <Separator className="my-4" />

                <h4 className="font-semibold text-blue-900 mb-3">Objectifs d'apprentissage</h4>
                <ul className="space-y-2">
                  {(module.objectives || ['Pas d\'objectifs définis']).map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions du module */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {module.quiz ? (
                    <>
                      {module.isCompleted ? (
                        <Link href={`/modules/${module.id}/quiz`}>
                          <Button className="w-full bg-green-500 hover:bg-green-600">
                            <BookOpen className="w-4 h-4 mr-2" />
                            {module.quiz.userResult ? 'Repasser le quiz' : 'Passer le quiz'}
                          </Button>
                        </Link>
                      ) : (
                        <Button disabled className="w-full bg-gray-400">
                          <Lock className="w-4 h-4 mr-2" />
                          Quiz disponible après visionnage complet
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">Aucun quiz disponible pour ce module</p>
                    </div>
                  )}
                  
                  <Link href="/modules">
                    <Button variant="outline" className="w-full">
                      Retour aux modules
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  {module.navigation.previous ? (
                    <Link href={`/modules/${module.navigation.previous.id}`}>
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Module {module.navigation.previous.order}
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Précédent
                    </Button>
                  )}
                  
                  {module.navigation.next ? (
                    module.navigation.next.unlocked ? (
                      <Link href={`/modules/${module.navigation.next.id}`}>
                        <Button variant="outline" size="sm">
                          Module {module.navigation.next.order}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="w-4 h-4 mr-1" />
                        Module {module.navigation.next.order}
                      </Button>
                    )
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contenu détaillé */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-orange-500" />
              Contenu Détaillé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: module.content || '<p class="text-gray-600">Contenu du module à venir...</p>' 
              }}
            />
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}