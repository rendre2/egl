'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Info, AlertTriangle, CheckCircle } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success'
  date: string
}

export function AnnouncementsSection() {
  const { data: session } = useSession()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/homepage')
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.homepage && data.homepage.announcements) {
          // Parse sécurisé des annonces
          let announcementsData = []
          
          if (typeof data.homepage.announcements === 'string') {
            try {
              announcementsData = JSON.parse(data.homepage.announcements)
            } catch (parseError) {
              console.warn('Erreur lors du parsing des annonces:', parseError)
              announcementsData = []
            }
          } else if (Array.isArray(data.homepage.announcements)) {
            announcementsData = data.homepage.announcements
          }
          
          // Trier par date (plus récent en premier)
          const sortedAnnouncements = Array.isArray(announcementsData) 
            ? announcementsData.sort((a: Announcement, b: Announcement) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              )
            : []
          
          setAnnouncements(sortedAnnouncements)
        } else {
          setAnnouncements([])
        }

      } catch (error) {
        console.error('Erreur lors du chargement des annonces:', error)
        setError(error instanceof Error ? error.message : 'Erreur inconnue')
        setAnnouncements([])
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const createNotificationFromAnnouncement = async (announcement: Announcement) => {
    if (!session?.user?.id) return

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: announcement.title,
          content: announcement.content,
          type: announcement.type.toUpperCase(),
          userId: null // Notification globale
        })
      })
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error)
    }
  }

  // Créer des notifications pour les nouvelles annonces
  useEffect(() => {
    if (session?.user?.role === 'ADMIN' && announcements.length > 0) {
      announcements.forEach(announcement => {
        const announcementDate = new Date(announcement.date)
        const now = new Date()
        const timeDiff = now.getTime() - announcementDate.getTime()
        
        // Si l'annonce a moins de 5 minutes, créer une notification
        if (timeDiff < 5 * 60 * 1000) {
          createNotificationFromAnnouncement(announcement)
        }
      })
    }
  }, [announcements, session])
  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'warning':
        return 'destructive' as const
      case 'success':
        return 'default' as const
      default:
        return 'secondary' as const
    }
  }

  if (loading) {
    return (
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </section>
    )
  }

  // Ne pas afficher la section s'il n'y a pas d'annonces
  if (announcements.length === 0) {
    return null
  }

  return (
    <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Megaphone className="w-6 h-6 text-orange-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Annonces
          </h2>
        </div>

        {error && (
          <div className="mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">
                Erreur lors du chargement des annonces
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card 
              key={announcement.id} 
              className={`border-l-4 ${getAnnouncementColor(announcement.type)} relative`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getAnnouncementIcon(announcement.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={getBadgeVariant(announcement.type)}>
                          {announcement.type === 'info' ? 'Info' :
                           announcement.type === 'warning' ? 'Attention' : 'Succès'}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(announcement.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}