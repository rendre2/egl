'use client'

import { useState, useEffect, Key } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  BookOpen, 
  HelpCircle, 
  Settings, 
  BarChart3, 
  Mail, 
  UserCheck, 
  UserX, 
  TrendingUp,
  Clock,
  Award,
  Home,
  Shield,
  Database,
  Activity,
  Video,
  Book
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AdminStats } from '@/lib/types'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques')
      }
      const data: AdminStats = await response.json()
      setStats(data)
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error)
      toast.error(error.message || 'Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 dark:text-gray-400">Impossible de charger les statistiques</p>
        </div>
      </div>
    )
  }

  const completionRate = stats.totalUsers > 0 && stats.totalModules > 0 
    ? Math.round((stats.completedModules / (stats.totalUsers * stats.totalModules)) * 100) 
    : 0
  const verificationRate = stats.totalUsers > 0 
    ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) 
    : 0

  // Fonction helper pour le formatage des dates
  const formatActivityDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  // Fonction helper pour le nom d'utilisateur
  const getUserDisplayName = (user: string) => {
    return user || 'Utilisateur inconnu'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                Tableau de Bord Administrateur
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Bienvenue, {session?.user.name || 'Administrateur'} - Gérez votre plateforme de formation spirituelle
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Shield className="w-4 h-4 mr-1" />
                Administrateur
              </Badge>
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Voir le Site
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Utilisateurs Totaux</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-blue-200">
                    +{stats.registrationsThisMonth} ce mois
                  </p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Emails Vérifiés</p>
                  <p className="text-3xl font-bold">{stats.verifiedUsers}</p>
                  <p className="text-sm text-green-200">
                    {verificationRate}% du total
                  </p>
                </div>
                <UserCheck className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Modules Actifs</p>
                  <p className="text-3xl font-bold">{stats.activeModules}</p>
                  <p className="text-sm text-orange-200">
                    Sur {stats.totalModules} total
                  </p>
                </div>
                <BookOpen className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Score Moyen</p>
                  <p className="text-3xl font-bold">{stats.averageScore}%</p>
                  <p className="text-sm text-purple-200">
                    {stats.totalQuizzes} QCM
                  </p>
                </div>
                <Award className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Taux de Complétion Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Modules terminés</span>
                  <span>{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.completedModules} modules terminés sur {stats.totalUsers * stats.totalModules} possibles
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-green-600" />
                Vérification des Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Emails vérifiés</span>
                  <span>{verificationRate}%</span>
                </div>
                <Progress value={verificationRate} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Vérifiés: {stats.verifiedUsers}</span>
                  <span>Non vérifiés: {stats.unverifiedUsers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-6">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/modules">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                      <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Modules</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Gérer les modules de formation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/chapters">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                      <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chapitres</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Organiser les chapitres des modules</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/contents">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                      <Video className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contenus</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Gérer les vidéos et audios</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/quiz">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                      <HelpCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">QCM</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Créer et gérer les questionnaires</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                      <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Utilisateurs</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Gérer les comptes utilisateurs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/homepage">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                      <Settings className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Page d'Accueil</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Personnaliser le contenu</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/daily-verse">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800 transition-colors">
                      <Book className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Verset du Jour</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Gérer les versets bibliques</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/analytics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                      <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytiques</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Statistiques et rapports</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-75 group">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                    <Mail className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Envoyer des messages (Bientôt)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.type === 'registration' && (
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      {activity.type === 'completion' && (
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      {activity.type === 'quiz_passed' && (
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                          <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                      )}
                      {activity.type === 'email_verified' && (
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                      )}
                      {!['registration', 'completion', 'quiz_passed', 'email_verified'].includes(activity.type) && (
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.type === 'registration' && `${getUserDisplayName(activity.user)} s'est inscrit`}
                        {activity.type === 'completion' && `${getUserDisplayName(activity.user)} a terminé ${activity.module || 'un module'}`}
                        {activity.type === 'quiz_passed' && `${getUserDisplayName(activity.user)} a réussi le QCM de ${activity.module || 'un module'}`}
                        {activity.type === 'email_verified' && `${getUserDisplayName(activity.user)} a vérifié son email`}
                        {!['registration', 'completion', 'quiz_passed', 'email_verified'].includes(activity.type) && `Activité inconnue`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Aucune activité récente
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}