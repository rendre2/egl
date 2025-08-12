'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  BookOpen, 
  HelpCircle, 
  TrendingUp,
  Clock,
  Award,
  UserCheck,
  UserX,
  Activity,
  BarChart3,
  Globe,
  Calendar
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
  Legend
} from 'recharts'

interface AnalyticsData {
  totalUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  activeUsers: number
  totalModules: number
  activeModules: number
  totalChapters: number
  totalContents: number
  totalQuizzes: number
  completedModules: number
  completedChapters: number
  completedContents: number
  averageScore: number
  registrationsThisMonth: number
  completionsThisMonth: number
  usersByCountry: { [key: string]: number }
  moduleProgress: Array<{
    id: string
    title: string
    order: number
    totalUsers: number
    completedUsers: number
    averageWatchTime: number
    duration: number
  }>
  recentActivity: Array<{
    id: string
    type: string
    user: string
    module?: string
    date: string
  }>
}

// Configuration des couleurs pour les graphiques
const chartColors = {
  users: "#0088FE",
  completed: "#00C49F",
  progress: "#FFBB28",
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchAnalytics()
  }, [session, status, router])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des analytics')
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (error: any) {
      console.error('Erreur lors du chargement des analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Composant de tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }}>
              {item.name}: {item.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600">Impossible de charger les analytics</p>
        </div>
      </div>
    )
  }

  const completionRate = analytics.totalUsers > 0 && analytics.totalModules > 0 
    ? Math.round((analytics.completedModules / (analytics.totalUsers * analytics.totalModules)) * 100) 
    : 0
  const verificationRate = analytics.totalUsers > 0 
    ? Math.round((analytics.verifiedUsers / analytics.totalUsers) * 100) 
    : 0

  // Données pour les graphiques
  const moduleProgressData = analytics.moduleProgress.map(module => ({
    name: `Module ${module.order}`,
    totalUsers: module.totalUsers,
    completedUsers: module.completedUsers,
    completionRate: module.totalUsers > 0 ? Math.round((module.completedUsers / module.totalUsers) * 100) : 0
  }))

  const usersByCountryData = Object.entries(analytics.usersByCountry)
    .map(([country, count]) => ({ name: country, value: count }))
    .slice(0, 10)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0']

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Analytics et Rapports</h1>
          <p className="text-gray-600 mt-2">Analysez les performances de votre plateforme de formation</p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Utilisateurs Totaux</p>
                  <p className="text-3xl font-bold">{analytics.totalUsers}</p>
                  <p className="text-sm text-blue-200">
                    +{analytics.registrationsThisMonth} ce mois
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
                  <p className="text-3xl font-bold">{analytics.verifiedUsers}</p>
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
                  <p className="text-orange-100">Contenus Actifs</p>
                  <p className="text-3xl font-bold">{analytics.totalContents}</p>
                  <p className="text-sm text-orange-200">
                    {analytics.totalChapters} chapitres
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
                  <p className="text-3xl font-bold">{analytics.averageScore}%</p>
                  <p className="text-sm text-purple-200">
                    {analytics.totalQuizzes} QCM
                  </p>
                </div>
                <Award className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Progression par module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Progression par Module
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleProgressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="totalUsers" fill={chartColors.users} name="Inscrits" />
                    <Bar dataKey="completedUsers" fill={chartColors.completed} name="Terminés" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Répartition par pays */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-green-600" />
                Utilisateurs par Pays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <Pie
                      data={usersByCountryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usersByCountryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Taux de complétion global */}
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
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{analytics.completedModules}</div>
                    <div className="text-gray-600">Modules</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{analytics.completedChapters}</div>
                    <div className="text-gray-600">Chapitres</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{analytics.completedContents}</div>
                    <div className="text-gray-600">Contenus</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-gray-600" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.type === 'registration' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      {activity.type === 'completion' && (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {activity.type === 'quiz_passed' && (
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Award className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                      {activity.type === 'email_verified' && (
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.type === 'registration' && `${activity.user} s'est inscrit`}
                        {activity.type === 'completion' && `${activity.user} a terminé ${activity.module}`}
                        {activity.type === 'quiz_passed' && `${activity.user} a réussi le QCM de ${activity.module}`}
                        {activity.type === 'email_verified' && `${activity.user} a vérifié son email`}
                      </p>
                      <p className="text-xs text-gray-500">
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
            </CardContent>
          </Card>
        </div>

        {/* Détails par module */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Performance par Module</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.moduleProgress.map((module) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Module {module.order}: {module.title}
                    </h3>
                    <Badge variant="outline">
                      {module.completedUsers}/{module.totalUsers} terminés
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Taux de complétion</span>
                      <span>
                        {module.totalUsers > 0 
                          ? Math.round((module.completedUsers / module.totalUsers) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                    <Progress 
                      value={module.totalUsers > 0 
                        ? (module.completedUsers / module.totalUsers) * 100
                        : 0
                      } 
                      className="h-2" 
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Temps moyen: {Math.floor(module.averageWatchTime / 60)}min</span>
                      <span>{module.totalUsers} utilisateurs inscrits</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}