'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  BookOpen, 
  Clock, 
  Eye, 
  EyeOff,
  Save,
  CheckCircle,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  pays: string
  ville: string
  adresse?: string
  paroisse?: string
  createdAt: string
  emailVerified: string | null
}

interface UserStats {
  totalModules: number
  completedModules: number
  totalChapters: number
  completedChapters: number
  totalContents: number
  completedContents: number
  totalWatchTime: number
  averageScore: number
  certificates: number
  lastActivity: string | null
}

interface RecentActivity {
  id: string
  type: 'module_completed' | 'chapter_completed' | 'content_completed' | 'quiz_passed'
  title: string
  date: string
  score?: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    pays: '',
    ville: '',
    adresse: '',
    paroisse: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du profil')
      }
      const data = await response.json()
      
      setProfile(data.profile)
      setStats(data.stats)
      setRecentActivity(data.recentActivity || [])
      
      if (data.profile) {
        setFormData({
          nom: data.profile.nom || '',
          prenom: data.profile.prenom || '',
          telephone: data.profile.telephone || '',
          pays: data.profile.pays || '',
          ville: data.profile.ville || '',
          adresse: data.profile.adresse || '',
          paroisse: data.profile.paroisse || ''
        })
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du profil:', error)
      toast.error(error.message || 'Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }

      toast.success('Profil mis à jour avec succès')
      await fetchProfile()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour du mot de passe')
      }

      toast.success('Mot de passe mis à jour avec succès')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordForm(false)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour du mot de passe')
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'module_completed':
        return <BookOpen className="w-4 h-4 text-green-600" />
      case 'chapter_completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'content_completed':
        return <Clock className="w-4 h-4 text-purple-600" />
      case 'quiz_passed':
        return <Award className="w-4 h-4 text-orange-600" />
      default:
        return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'module_completed':
        return `Module terminé : ${activity.title}`
      case 'chapter_completed':
        return `Chapitre terminé : ${activity.title}`
      case 'content_completed':
        return `Contenu terminé : ${activity.title}`
      case 'quiz_passed':
        return `Quiz réussi : ${activity.title} (${activity.score}%)`
      default:
        return activity.title
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!profile || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur de chargement</h2>
          <p className="text-gray-600">Impossible de charger votre profil</p>
        </div>
      </div>
    )
  }

  const completionRate = stats.totalModules > 0 
    ? Math.round((stats.completedModules / stats.totalModules) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Header />
      <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Mon Profil</h1>
          <p className="text-xl text-gray-600">
            Gérez vos informations personnelles et suivez votre progression
          </p>
        </div>

        {/* Statistiques de progression */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Modules Complétés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedModules}/{stats.totalModules}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Contenus Terminés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedContents}/{stats.totalContents}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(stats.totalWatchTime)}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Informations Personnelles</TabsTrigger>
            <TabsTrigger value="progress">Progression</TabsTrigger>
            <TabsTrigger value="activity">Activité Récente</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informations Personnelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom</Label>
                      <Input
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom</Label>
                      <Input
                        id="prenom"
                        value={formData.prenom}
                        onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telephone">Téléphone</Label>
                      <Input
                        id="telephone"
                        value={formData.telephone}
                        onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500">L'email ne peut pas être modifié</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pays">Pays</Label>
                      <Input
                        id="pays"
                        value={formData.pays}
                        onChange={(e) => setFormData(prev => ({ ...prev, pays: e.target.value }))}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ville">Ville</Label>
                      <Input
                        id="ville"
                        value={formData.ville}
                        onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      value={formData.adresse}
                      onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paroisse">Paroisse</Label>
                    <Input
                      id="paroisse"
                      value={formData.paroisse}
                      onChange={(e) => setFormData(prev => ({ ...prev, paroisse: e.target.value }))}
                      disabled={saving}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
              </CardHeader>
              <CardContent>
                {!showPasswordForm ? (
                  <Button 
                    onClick={() => setShowPasswordForm(true)}
                    variant="outline"
                  >
                    Modifier le mot de passe
                  </Button>
                ) : (
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="submit" 
                        className="bg-orange-500 hover:bg-orange-600"
                        disabled={saving}
                      >
                        {saving ? 'Mise à jour...' : 'Mettre à jour'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowPasswordForm(false)
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          })
                        }}
                        disabled={saving}
                      >
                        Annuler
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Progression Globale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Modules complétés</span>
                      <span>{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-3" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.completedChapters}</div>
                      <div className="text-sm text-gray-600">Chapitres terminés</div>
                      <div className="text-xs text-gray-500">sur {stats.totalChapters}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.completedContents}</div>
                      <div className="text-sm text-gray-600">Contenus terminés</div>
                      <div className="text-xs text-gray-500">sur {stats.totalContents}</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.certificates}</div>
                      <div className="text-sm text-gray-600">Certificats obtenus</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {getActivityText(activity)}
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
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Aucune activité récente
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Informations du compte */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informations du Compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Membre depuis</p>
                  <p className="text-sm text-gray-600">
                    {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Statut Email</p>
                  <Badge className={profile.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {profile.emailVerified ? 'Vérifié' : 'Non vérifié'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  )
}