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
  Headphones,
  RefreshCw,
  AlertTriangle
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
  const [volume, setVolume] = useState(1)
  const [localProgress, setLocalProgress] = useState(0)
  const [updateInProgress, setUpdateInProgress] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null)
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null)

  // Vérifier le format de l'URL et le type MIME
  const getSupportedFormats = (type: 'VIDEO' | 'AUDIO') => {
    const video = document.createElement('video')
    const audio = document.createElement('audio')
    
    if (type === 'VIDEO') {
      return {
        mp4: video.canPlayType('video/mp4'),
        webm: video.canPlayType('video/webm'),
        ogg: video.canPlayType('video/ogg')
      }
    } else {
      return {
        mp3: audio.canPlayType('audio/mpeg'),
        ogg: audio.canPlayType('audio/ogg'),
        wav: audio.canPlayType('audio/wav'),
        m4a: audio.canPlayType('audio/mp4')
      }
    }
  }

  // Fonction pour valider l'URL
  const validateMediaUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

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
            
            // Vérifier la validité de l'URL
            console.log('URL du média:', data.url)
            console.log('Type de contenu:', data.type)
            console.log('Formats supportés:', getSupportedFormats(data.type))
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

  // Configuration du média player améliorée
  useEffect(() => {
    const media = mediaRef.current
    if (!media || !content) return

    console.log('Configuration du média player pour:', content.type, content.url)
    setMediaLoaded(false)
    setMediaError(null)

    const handleLoadStart = () => {
      console.log('Début du chargement du média')
      setMediaError(null)
      setIsRetrying(false)
    }

    const handleLoadedMetadata = () => {
      console.log('Métadonnées chargées, durée:', media.duration)
      if (isNaN(media.duration) || media.duration === 0) {
        setMediaError('Durée du média invalide')
        return
      }
      
      setDuration(media.duration)
      setMediaError(null)
      setMediaLoaded(true)
      
      // Reprendre là où l'utilisateur s'était arrêté
      if (content.watchTime > 0 && content.watchTime < media.duration) {
        media.currentTime = content.watchTime
        console.log('Position restaurée à:', content.watchTime)
      }
    }

    const handleCanPlay = () => {
      console.log('Le média peut être lu')
      setMediaError(null)
      setMediaLoaded(true)
    }

    const handleTimeUpdate = () => {
      const current = media.currentTime
      setCurrentTime(current)
      
      if (media.duration > 0) {
        const progress = (current / media.duration) * 100
        setLocalProgress(progress)
      }
    }

    const handlePlay = () => {
      console.log('Lecture démarrée')
      setIsPlaying(true)
      setMediaError(null)
    }
    
    const handlePause = () => {
      console.log('Lecture mise en pause')
      setIsPlaying(false)
    }

    const handleError = (e: Event) => {
      const target = e.target as HTMLMediaElement
      const error = target.error
      
      console.error('Erreur média:', {
        code: error?.code,
        message: error?.message,
        url: content.url,
        type: content.type
      })
      
      let errorMessage = 'Erreur de lecture inconnue'
      
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Lecture interrompue par l\'utilisateur'
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Erreur réseau lors du téléchargement'
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Erreur de décodage du média'
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Format de média non supporté ou URL invalide'
            break
          default:
            errorMessage = error.message || 'Format non supporté'
        }
      }
      
      setMediaError(errorMessage)
      setIsPlaying(false)
      setMediaLoaded(false)
    }

    const handleStalled = () => {
      console.warn('Chargement du média bloqué')
      // Ne pas considérer comme une erreur, juste un avertissement
    }

    const handleWaiting = () => {
      console.log('En attente de données...')
    }

    // Ajouter les event listeners
    media.addEventListener('loadstart', handleLoadStart)
    media.addEventListener('loadedmetadata', handleLoadedMetadata)
    media.addEventListener('canplay', handleCanPlay)
    media.addEventListener('timeupdate', handleTimeUpdate)
    media.addEventListener('play', handlePlay)
    media.addEventListener('pause', handlePause)
    media.addEventListener('error', handleError)
    media.addEventListener('stalled', handleStalled)
    media.addEventListener('waiting', handleWaiting)

    // Configuration initiale
    media.volume = volume
    media.preload = 'metadata'
    
    // Forcer le rechargement si l'URL a changé
    media.load()

    // Nettoyage
    return () => {
      media.removeEventListener('loadstart', handleLoadStart)
      media.removeEventListener('loadedmetadata', handleLoadedMetadata)
      media.removeEventListener('canplay', handleCanPlay)
      media.removeEventListener('timeupdate', handleTimeUpdate)
      media.removeEventListener('play', handlePlay)
      media.removeEventListener('pause', handlePause)
      media.removeEventListener('error', handleError)
      media.removeEventListener('stalled', handleStalled)
      media.removeEventListener('waiting', handleWaiting)
      
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current)
      }
    }
  }, [content, volume])

  // Mise à jour périodique de la progression
  useEffect(() => {
    if (isPlaying && currentTime > 0) {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current)
      }
      
      progressUpdateInterval.current = setInterval(() => {
        if (mediaRef.current && isPlaying) {
          updateProgress(mediaRef.current.currentTime)
        }
      }, 10000)
    } else {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current)
      }
    }

    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current)
      }
    }
  }, [isPlaying, currentTime])

  // Contrôles du lecteur
  const togglePlay = async () => {
    const media = mediaRef.current
    if (!media || !mediaLoaded) {
      setMediaError('Média non chargé')
      return
    }

    try {
      if (isPlaying) {
        media.pause()
      } else {
        await media.play()
      }
    } catch (error: any) {
      console.error('Erreur lors de la lecture:', error)
      setMediaError(`Impossible de lire le média: ${error.message}`)
    }
  }

  const handleSeek = (seconds: number) => {
    const media = mediaRef.current
    if (!media || !duration || !mediaLoaded) return
    
    const newTime = Math.max(0, Math.min(duration, media.currentTime + seconds))
    media.currentTime = newTime
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const media = mediaRef.current
    if (!media || !duration || !mediaLoaded) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    media.currentTime = newTime
  }

  const retryMedia = async () => {
    setIsRetrying(true)
    setMediaError(null)
    
    const media = mediaRef.current
    if (!media || !content) return

    try {
      // Vérifier d'abord si l'URL est accessible
      const isUrlValid = await validateMediaUrl(content.url)
      if (!isUrlValid) {
        throw new Error('URL du média inaccessible')
      }

      // Recharger le média
      media.load()
      
      setTimeout(() => {
        if (!mediaLoaded && !mediaError) {
          setMediaError('Timeout lors du chargement du média')
          setIsRetrying(false)
        }
      }, 10000) // Timeout après 10 secondes

    } catch (error: any) {
      console.error('Erreur lors de la nouvelle tentative:', error)
      setMediaError(`Impossible de charger le média: ${error.message}`)
      setIsRetrying(false)
    }
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
                {/* Affichage d'erreur amélioré */}
                {mediaError && (
                  <div className="absolute inset-0 bg-red-900/95 flex items-center justify-center z-10">
                    <div className="text-center text-white p-6 max-w-md">
                      <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                      <h3 className="text-xl font-bold mb-2">Erreur de lecture</h3>
                      <p className="text-sm opacity-90 mb-4">{mediaError}</p>
                      
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          variant="secondary"
                          onClick={retryMedia}
                          disabled={isRetrying}
                        >
                          {isRetrying ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Nouvelle tentative...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Réessayer
                            </>
                          )}
                        </Button>
                        
                        <details className="text-xs opacity-75">
                          <summary className="cursor-pointer">Informations techniques</summary>
                          <div className="mt-2 p-2 bg-black/20 rounded text-left">
                            <div><strong>URL:</strong> {content.url}</div>
                            <div><strong>Type:</strong> {content.type}</div>
                            <div><strong>État:</strong> {mediaLoaded ? 'Chargé' : 'Non chargé'}</div>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                )}

                {/* Indicateur de chargement */}
                {!mediaLoaded && !mediaError && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                    <div className="text-center text-white">
                      <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin" />
                      <p>Chargement du média...</p>
                    </div>
                  </div>
                )}

                {content.type === 'VIDEO' ? (
                  <video
                    ref={mediaRef}
                    src={content.url}
                    className="w-full aspect-video"
                    preload="metadata"
                    playsInline
                    crossOrigin="anonymous"
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Headphones className="w-24 h-24 mx-auto mb-4 opacity-50" />
                      <h3 className="text-2xl font-bold mb-4">{content.title}</h3>
                      <audio
                        ref={mediaRef}
                        src={content.url}
                        preload="metadata"
                        crossOrigin="anonymous"
                        className="hidden"
                      >
                        Votre navigateur ne supporte pas la lecture audio.
                      </audio>
                    </div>
                  </div>
                )}
                
                {/* Contrôles personnalisés - uniquement si le média est chargé */}
                {mediaLoaded && !mediaError && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                    <div className="space-y-2">
                      {/* Barre de progression cliquable */}
                      <div 
                        className="w-full h-2 bg-white/20 rounded-full cursor-pointer"
                        onClick={handleProgressClick}
                      >
                        <div 
                          className="h-full bg-orange-500 rounded-full transition-all duration-300"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={togglePlay}
                            className="text-white hover:bg-white/20"
                            disabled={!mediaLoaded}
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSeek(-10)}
                            className="text-white hover:bg-white/20"
                            disabled={!mediaLoaded}
                          >
                            <SkipBack className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSeek(10)}
                            className="text-white hover:bg-white/20"
                            disabled={!mediaLoaded}
                          >
                            <SkipForward className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                          
                          <div className="flex items-center space-x-2">
                            <Volume2 className="w-4 h-4" />
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={(e) => {
                                const newVolume = parseFloat(e.target.value)
                                setVolume(newVolume)
                                if (mediaRef.current) {
                                  mediaRef.current.volume = newVolume
                                }
                              }}
                              className="w-16"
                            />
                          </div>
                          
                          {content.type === 'VIDEO' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (mediaRef.current && 'requestFullscreen' in mediaRef.current) {
                                  (mediaRef.current as any).requestFullscreen()
                                }
                              }}
                              className="text-white hover:bg-white/20"
                              disabled={!mediaLoaded}
                            >
                              <Maximize className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
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
                  {mediaLoaded && (
                    <Badge variant="outline" className="text-green-600">
                      Chargé
                    </Badge>
                  )}
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
                
                {/* Informations de debug améliorées */}
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer">Informations techniques</summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-600 space-y-1">
                    <div><strong>URL:</strong> <span className="break-all">{content.url}</span></div>
                    <div><strong>État:</strong> {isPlaying ? 'En cours' : 'En pause'}</div>
                    <div><strong>Chargé:</strong> {mediaLoaded ? 'Oui' : 'Non'}</div>
                    <div><strong>Temps:</strong> {formatTime(currentTime)} / {formatTime(duration)}</div>
                    <div><strong>Progression:</strong> {Math.round(localProgress)}%</div>
                    {mediaError && <div className="text-red-600"><strong>Erreur:</strong> {mediaError}</div>}
                  </div>
                </details>
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