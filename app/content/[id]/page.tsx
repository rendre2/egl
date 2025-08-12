'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Maximize, 
  CheckCircle, 
  Clock,
  ArrowLeft,
  ArrowRight,
  Video,
  Headphones
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Content {
  id: string
  title: string
  description?: string
  type: 'VIDEO' | 'AUDIO'
  url: string
  duration: number
  order: number
  progress: number
  isCompleted: boolean
  watchTime: number
  chapter: {
    id: string
    title: string
    order: number
    module: {
      id: string
      title: string
      order: number
    }
  }
  navigation: {
    previous: {
      id: string
      title: string
      type: 'VIDEO' | 'AUDIO'
      unlocked: boolean
    } | null
    next: {
      id: string
      title: string
      type: 'VIDEO' | 'AUDIO'
      unlocked: boolean
    } | null
  }
}

export default function ContentDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [localProgress, setLocalProgress] = useState(0)
  const [updateInProgress, setUpdateInProgress] = useState(false)
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null)
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null)

  // Redirection si non connecté
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Charger les données du contenu
  useEffect(() => {
    if (session && params.id) {
      const fetchContent = async () => {
        try {
          const response = await fetch(`/api/content/${params.id}`)
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Erreur lors de la récupération du contenu')
          }
          const data = await response.json()
          if (data.success) {
            setContent(data)
            setLocalProgress(data.progress || 0)
          } else {
            throw new Error(data.message || 'Erreur lors de la récupération du contenu')
          }
        } catch (error: any) {
          console.error('Erreur lors du chargement du contenu:', error)
          toast.error(error.message || 'Impossible de charger le contenu')
          router.push('/modules')
        } finally {
          setLoading(false)
        }
      }
      fetchContent()
    }
  }, [session, params.id, router])

  // Fonction pour mettre à jour la progression
  const updateProgress = async (watchTime: number) => {
    if (updateInProgress || !content) return
    
    setUpdateInProgress(true)
    try {
      const response = await fetch(`/api/content-progress/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchTime: Math.floor(watchTime) })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.data.isCompleted && !content.isCompleted) {
          setContent(prev => prev ? { ...prev, isCompleted: true } : null)
          toast.success('Contenu terminé ! Vous pouvez passer au suivant.')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error)
    } finally {
      setUpdateInProgress(false)
    }
  }

  // Gestion du lecteur média
  useEffect(() => {
    const media = mediaRef.current
    if (!media || !content) return

    const updateTime = () => {
      const current = media.currentTime
      setCurrentTime(current)
      
      if (media.duration > 0) {
        const progress = (current / media.duration) * 100
        setLocalProgress(progress)
        
        // Marquer comme complété à 100% uniquement
        if (progress >= 100 && !content.isCompleted) {
          setContent(prev => prev ? { ...prev, isCompleted: true } : null)
          updateProgress(current)
          toast.success('Contenu terminé ! Vous pouvez passer au suivant.')
        }
      }
    }

    const updateDuration = () => {
      setDuration(media.duration)
      // Reprendre là où l'utilisateur s'était arrêté
      if (content.watchTime > 0) {
        media.currentTime = content.watchTime
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    media.addEventListener('timeupdate', updateTime)
    media.addEventListener('loadedmetadata', updateDuration)
    media.addEventListener('play', handlePlay)
    media.addEventListener('pause', handlePause)

    // Mise à jour périodique de la progression
    progressUpdateInterval.current = setInterval(() => {
      if (isPlaying && media.currentTime > 0) {
        updateProgress(media.currentTime)
      }
    }, 10000) // Toutes les 10 secondes

    return () => {
      media.removeEventListener('timeupdate', updateTime)
      media.removeEventListener('loadedmetadata', updateDuration)
      media.removeEventListener('play', handlePlay)
      media.removeEventListener('pause', handlePause)
      
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current)
      }
      
      // Sauvegarder la progression avant de quitter
      if (media.currentTime > 0) {
        updateProgress(media.currentTime)
      }
    }
  }, [content, isPlaying, localProgress])

  const togglePlay = () => {
    const media = mediaRef.current
    if (!media) return

    if (isPlaying) {
      media.pause()
    } else {
      media.play()
    }
  }

  const handleSeek = (seconds: number) => {
    const media = mediaRef.current
    if (!media) return
    media.currentTime = Math.max(0, media.currentTime + seconds)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contenu non trouvé</h2>
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
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-600">
              Module {content.chapter.module.order}
            </Badge>
            <Badge variant="outline" className="text-purple-600">
              Chapitre {content.chapter.order}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden shadow-xl">
              <div className="relative bg-black">
                {content.type === 'VIDEO' ? (
                  <video
                    ref={mediaRef as React.RefObject<HTMLVideoElement>}
                    src={content.url}
                    className="w-full aspect-video"
                    preload="metadata"
                    controls
                  />
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Headphones className="w-24 h-24 mx-auto mb-4 opacity-50" />
                      <h3 className="text-2xl font-bold mb-2">{content.title}</h3>
                      <audio
                        ref={mediaRef as React.RefObject<HTMLAudioElement>}
                        src={content.url}
                        className="w-full max-w-md"
                        controls
                        preload="metadata"
                      />
                    </div>
                  </div>
                )}
                
                {content.type === 'VIDEO' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center space-x-4 text-white">
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
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <span>{formatTime(currentTime)}</span>
                          <div className="flex-1">
                            <Progress value={(currentTime / duration) * 100} className="h-1" />
                          </div>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                      >
                        <Volume2 className="w-5 h-5" />
                      </Button>
                      
                      {content.type === 'VIDEO' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => (mediaRef.current as HTMLVideoElement)?.requestFullscreen()}
                          className="text-white hover:bg-white/20"
                        >
                          <Maximize className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-500" />
                  Progression du Contenu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Temps visionné/écouté</span>
                    <span className="font-semibold">{Math.round(localProgress)}%</span>
                  </div>
                  <Progress value={localProgress} className="h-3" />
                  
                  {content.isCompleted && (
                    <div className="flex items-center text-green-600 font-semibold">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Contenu terminé ! Vous pouvez passer au suivant.
                    </div>
                  )}
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Important :</strong> Vous devez visionner/écouter le contenu à 100% 
                      pour le valider et débloquer le contenu suivant.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  {content.type === 'VIDEO' ? (
                    <Video className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Headphones className="w-5 h-5 text-purple-600" />
                  )}
                  <Badge variant="outline">
                    {content.type === 'VIDEO' ? 'Vidéo' : 'Audio'}
                  </Badge>
                </div>
                <CardTitle className="text-2xl text-blue-900">
                  {content.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content.description && (
                  <p className="text-gray-600 mb-4">
                    {content.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Durée : {formatDuration(content.duration)}
                  </div>
                  <div>
                    Module {content.chapter.module.order}: {content.chapter.module.title}
                  </div>
                  <div>
                    Chapitre {content.chapter.order}: {content.chapter.title}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {content.navigation.previous ? (
                    <Link href={content.navigation.previous.unlocked ? `/content/${content.navigation.previous.id}` : '#'}>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={!content.navigation.previous.unlocked}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <div className="flex items-center">
                          {content.navigation.previous.type === 'VIDEO' ? (
                            <Video className="w-4 h-4 mr-2" />
                          ) : (
                            <Headphones className="w-4 h-4 mr-2" />
                          )}
                          {content.navigation.previous.title}
                        </div>
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </Button>
                  )}
                  
                  {content.navigation.next ? (
                    <Link href={content.navigation.next.unlocked ? `/content/${content.navigation.next.id}` : '#'}>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={!content.navigation.next.unlocked}
                      >
                        <div className="flex items-center">
                          {content.navigation.next.type === 'VIDEO' ? (
                            <Video className="w-4 h-4 mr-2" />
                          ) : (
                            <Headphones className="w-4 h-4 mr-2" />
                          )}
                          {content.navigation.next.title}
                        </div>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full justify-start" disabled>
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Link href="/modules">
                  <Button variant="outline" className="w-full">
                    Retour aux modules
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}