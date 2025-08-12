'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Bell, X, Info, AlertTriangle, CheckCircle, Megaphone } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Notification {
  id: string
  title: string
  content: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ANNOUNCEMENT'
  isRead: boolean
  createdAt: string
}

export function NotificationsPanel() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-5 h-5 text-blue-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!session) return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500">
                {unreadCount}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Card>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.isRead ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}