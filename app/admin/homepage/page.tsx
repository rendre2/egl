'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Save, Image, MessageSquare, Megaphone, X } from 'lucide-react'
import { toast } from 'sonner'
import { Testimonial, Announcement, HomepageData } from '@/lib/types'

export default function AdminHomepagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null)
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false)
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])

  const [heroData, setHeroData] = useState({
    heroTitle: '',
    heroSubtitle: '',
    heroImage: ''
  })

  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    location: '',
    content: '',
    rating: 5,
    avatar: ''
  })

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success'
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchData()
    // Load dismissed announcements from localStorage
    const storedDismissed = localStorage.getItem('dismissedAnnouncements')
    if (storedDismissed) {
      setDismissedAnnouncements(JSON.parse(storedDismissed))
    }
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [homepageRes, modulesRes] = await Promise.all([
        fetch('/api/homepage'),
        fetch('/api/admin/modules')
      ])

      if (!homepageRes.ok) {
        throw new Error(`Erreur homepage API: ${homepageRes.status}`)
      }
      
      const homepageData = await homepageRes.json()
      const homepage = homepageData.homepage

      if (homepage) {
        setHomepageData({
          ...homepage,
          testimonials: homepage.testimonials ? JSON.parse(homepage.testimonials) : [],
          announcements: homepage.testimonials ? JSON.parse(homepage.announcements) : [],
          featuredModules: homepage.featuredModules ? JSON.parse(homepage.featuredModules) : []
        })
        setHeroData({
          heroTitle: homepage.heroTitle || '',
          heroSubtitle: homepage.heroSubtitle || '',
          heroImage: homepage.heroImage || ''
        })
      }

      if (modulesRes.ok) {
        const modulesData = await modulesRes.json()
        setModules(modulesData.modules || [])
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error)
      toast.error(error.message || 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const validateTestimonialForm = () => {
    if (!testimonialForm.name.trim() || !testimonialForm.location.trim() || !testimonialForm.content.trim()) {
      toast.error('Tous les champs obligatoires doivent être remplis')
      return false
    }
    if (testimonialForm.rating < 1 || testimonialForm.rating > 5) {
      toast.error('La note doit être comprise entre 1 et 5')
      return false
    }
    return true
  }

  const validateAnnouncementForm = () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.error('Tous les champs obligatoires doivent être remplis')
      return false
    }
    if (!['info', 'warning', 'success'].includes(announcementForm.type)) {
      toast.error('Type d\'annonce invalide')
      return false
    }
    return true
  }


  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateTestimonialForm() || saving) return

    const newTestimonial: Testimonial = {
      id: editingTestimonial?.id || Date.now().toString(),
      ...testimonialForm
    }

    let updatedTestimonials = [...(homepageData?.testimonials || [])]

    if (editingTestimonial) {
      updatedTestimonials = updatedTestimonials.map(t =>
        t.id === editingTestimonial.id ? newTestimonial : t
      )
    } else {
      updatedTestimonials.push(newTestimonial)
    }

    try {
      setSaving(true)
      const response = await fetch('/api/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroTitle: homepageData?.heroTitle || "Notre proposition",
          heroSubtitle: homepageData?.heroSubtitle || "Bienvenue dans le domaine d'Israël chrétien dédié à l'enseignement spirituel et à l'édification communautaire !",
          heroImage: homepageData?.heroImage || "heros.jpg",
          featuredModules: homepageData?.featuredModules || [],
          testimonials: updatedTestimonials,
          announcements: homepageData?.announcements || [],
          testimonialsTitle: homepageData?.testimonialsTitle || "Témoignages de nos Étudiants",
          testimonialsSubtitle: homepageData?.testimonialsSubtitle || "Découvrez comment notre formation spirituelle a impacté la vie de nos frères et sœurs",
          ctaTitle: homepageData?.ctaTitle || "Rejoignez notre Communauté",
          ctaSubtitle: homepageData?.ctaSubtitle || "Commencez votre parcours de formation spirituelle dès aujourd'hui et grandissez avec nous dans la foi.",
        }),
      })

      if (response.ok) {
        toast.success(editingTestimonial ? 'Témoignage mis à jour' : 'Témoignage ajouté')
        setIsTestimonialDialogOpen(false)
        resetTestimonialForm()
        await fetchData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAnnouncementForm() || saving) return

    const newAnnouncement: Announcement = {
      id: editingAnnouncement?.id || Date.now().toString(),
      ...announcementForm,
      date: new Date().toISOString()
    }

    let updatedAnnouncements = [...(homepageData?.announcements || [])]

    if (editingAnnouncement) {
      updatedAnnouncements = updatedAnnouncements.map(a =>
        a.id === editingAnnouncement.id ? newAnnouncement : a
      )
      // Clear dismissed announcements when updating
      setDismissedAnnouncements([])
      localStorage.setItem('dismissedAnnouncements', JSON.stringify([]))
    } else {
      updatedAnnouncements.push(newAnnouncement)
    }

    try {
      setSaving(true)
      const response = await fetch('/api/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroTitle: homepageData?.heroTitle || "Notre proposition",
          heroSubtitle: homepageData?.heroSubtitle || "Bienvenue dans le domaine d'Israël chrétien dédié à l'enseignement spirituel et à l'édification communautaire !",
          heroImage: homepageData?.heroImage || "heros.jpg",
          featuredModules: homepageData?.featuredModules || [],
          testimonials: homepageData?.testimonials || [],
          announcements: updatedAnnouncements,
          testimonialsTitle: homepageData?.testimonialsTitle || "Témoignages de nos Étudiants",
          testimonialsSubtitle: homepageData?.testimonialsSubtitle || "Découvrez comment notre formation spirituelle a impacté la vie de nos frères et sœurs",
          ctaTitle: homepageData?.ctaTitle || "Rejoignez notre Communauté",
          ctaSubtitle: homepageData?.ctaSubtitle || "Commencez votre parcours de formation spirituelle dès aujourd'hui et grandissez avec nous dans la foi.",
        }),
      })

      if (response.ok) {
        toast.success(editingAnnouncement ? 'Annonce mise à jour' : 'Annonce ajoutée')
        setIsAnnouncementDialogOpen(false)
        resetAnnouncementForm()
        await fetchData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const deleteTestimonial = async (id: string) => {
    if (saving) return
    
    const updatedTestimonials = homepageData?.testimonials.filter(t => t.id !== id) || []

    try {
      setSaving(true)
      const response = await fetch('/api/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroTitle: homepageData?.heroTitle || "Notre proposition",
          heroSubtitle: homepageData?.heroSubtitle || "Bienvenue dans le domaine d'Israël chrétien dédié à l'enseignement spirituel et à l'édification communautaire !",
          heroImage: homepageData?.heroImage || "heros.jpg",
          featuredModules: homepageData?.featuredModules || [],
          testimonials: updatedTestimonials,
          announcements: homepageData?.announcements || [],
          testimonialsTitle: homepageData?.testimonialsTitle || "Témoignages de nos Étudiants",
          testimonialsSubtitle: homepageData?.testimonialsSubtitle || "Découvrez comment notre formation spirituelle a impacté la vie de nos frères et sœurs",
          ctaTitle: homepageData?.ctaTitle || "Rejoignez notre Communauté",
          ctaSubtitle: homepageData?.ctaSubtitle || "Commencez votre parcours de formation spirituelle dès aujourd'hui et grandissez avec nous dans la foi.",
        }),
      })

      if (response.ok) {
        toast.success('Témoignage supprimé')
        await fetchData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erreur lors de la suppression')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setSaving(false)
    }
  }

  const deleteAnnouncement = async (id: string) => {
    if (saving) return
    
    const updatedAnnouncements = homepageData?.announcements.filter(a => a.id !== id) || []

    try {
      setSaving(true)
      const response = await fetch('/api/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroTitle: homepageData?.heroTitle || "Notre proposition",
          heroSubtitle: homepageData?.heroSubtitle || "Bienvenue dans le domaine d'Israël chrétien dédié à l'enseignement spirituel et à l'édification communautaire !",
          heroImage: homepageData?.heroImage || "heros.jpg",
          featuredModules: homepageData?.featuredModules || [],
          testimonials: homepageData?.testimonials || [],
          announcements: updatedAnnouncements,
          testimonialsTitle: homepageData?.testimonialsTitle || "Témoignages de nos Étudiants",
          testimonialsSubtitle: homepageData?.testimonialsSubtitle || "Découvrez comment notre formation spirituelle a impacté la vie de nos frères et sœurs",
          ctaTitle: homepageData?.ctaTitle || "Rejoignez notre Communauté",
          ctaSubtitle: homepageData?.ctaSubtitle || "Commencez votre parcours de formation spirituelle dès aujourd'hui et grandissez avec nous dans la foi.",
        }),
      })

      if (response.ok) {
        toast.success('Annonce supprimée')
        // Remove from dismissed announcements if present
        const newDismissed = dismissedAnnouncements.filter(aId => aId !== id)
        setDismissedAnnouncements(newDismissed)
        localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
        await fetchData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erreur lors de la suppression')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setSaving(false)
    }
  }

  const dismissAnnouncement = (id: string) => {
    const newDismissed = [...dismissedAnnouncements, id]
    setDismissedAnnouncements(newDismissed)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
  }

  const resetTestimonialForm = () => {
    setEditingTestimonial(null)
    setTestimonialForm({
      name: '',
      location: '',
      content: '',
      rating: 5,
      avatar: ''
    })
  }

  const resetAnnouncementForm = () => {
    setEditingAnnouncement(null)
    setAnnouncementForm({
      title: '',
      content: '',
      type: 'info'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Gestion de la Page d'Accueil</h1>
          <p className="text-gray-600 mt-2">Personnalisez le contenu de votre page d'accueil</p>
        </div>

        <div className="space-y-8">
          {/* Témoignages */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Témoignages
                </CardTitle>
                <Dialog open={isTestimonialDialogOpen} onOpenChange={setIsTestimonialDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600" disabled={saving}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un Témoignage
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingTestimonial ? 'Modifier le Témoignage' : 'Nouveau Témoignage'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom *</Label>
                        <Input
                          id="name"
                          value={testimonialForm.name}
                          onChange={(e) => setTestimonialForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Localisation *</Label>
                        <Input
                          id="location"
                          value={testimonialForm.location}
                          onChange={(e) => setTestimonialForm(prev => ({ ...prev, location: e.target.value }))}
                          required
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Contenu *</Label>
                        <Textarea
                          id="content"
                          value={testimonialForm.content}
                          onChange={(e) => setTestimonialForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={3}
                          required
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar">URL de l'avatar</Label>
                        <Input
                          id="avatar"
                          value={testimonialForm.avatar}
                          onChange={(e) => setTestimonialForm(prev => ({ ...prev, avatar: e.target.value }))}
                          placeholder="https://images.pexels.com/photos/..."
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rating">Note (1-5) *</Label>
                        <Input
                          id="rating"
                          type="number"
                          min="1"
                          max="5"
                          value={testimonialForm.rating}
                          onChange={(e) => setTestimonialForm(prev => ({ ...prev, rating: parseInt(e.target.value) || 1 }))}
                          required
                          disabled={saving}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsTestimonialDialogOpen(false)
                            resetTestimonialForm()
                          }}
                          disabled={saving}
                        >
                          Annuler
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-orange-500 hover:bg-orange-600"
                          disabled={saving}
                        >
                          {saving ? 'Sauvegarde...' : (editingTestimonial ? 'Mettre à jour' : 'Ajouter')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {homepageData?.testimonials?.map((testimonial) => (
                  <Card key={testimonial.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <img
                          src={testimonial.avatar || '/default-avatar.png'}
                          alt={testimonial.name}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/default-avatar.png'
                          }}
                        />
                        <div>
                          <h4 className="font-semibold">{testimonial.name}</h4>
                          <p className="text-sm text-gray-500">{testimonial.location}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTestimonial(testimonial)
                            setTestimonialForm({
                              name: testimonial.name,
                              location: testimonial.location,
                              content: testimonial.content,
                              rating: testimonial.rating,
                              avatar: testimonial.avatar
                            })
                            setIsTestimonialDialogOpen(true)
                          }}
                          disabled={saving}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTestimonial(testimonial.id)}
                          className="text-red-600"
                          disabled={saving}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm italic">"{testimonial.content}"</p>
                    <div className="flex mt-2">
                      {[...Array(Math.max(0, Math.min(5, testimonial.rating)))].map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>
                  </Card>
                )) || []}
              </div>
            </CardContent>
          </Card>

          {/* Annonces */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Megaphone className="w-5 h-5 mr-2" />
                  Annonces
                </CardTitle>
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600" disabled={saving}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une Annonce
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingAnnouncement ? 'Modifier l\'Annonce' : 'Nouvelle Annonce'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                          id="title"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Contenu *</Label>
                        <Textarea
                          id="content"
                          value={announcementForm.content}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={3}
                          required
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type *</Label>
                        <select
                          id="type"
                          value={announcementForm.type}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, type: e.target.value as 'info' | 'warning' | 'success' }))}
                          className="w-full p-2 border rounded-md"
                          disabled={saving}
                        >
                          <option value="info">Information</option>
                          <option value="warning">Avertissement</option>
                          <option value="success">Succès</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAnnouncementDialogOpen(false)
                            resetAnnouncementForm()
                          }}
                          disabled={saving}
                        >
                          Annuler
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-orange-500 hover:bg-orange-600"
                          disabled={saving}
                        >
                          {saving ? 'Sauvegarde...' : (editingAnnouncement ? 'Mettre à jour' : 'Ajouter')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {homepageData?.announcements
                  .filter((announcement) => !dismissedAnnouncements.includes(announcement.id))
                  .map((announcement) => (
                    <Card key={announcement.id} className="p-4 relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAnnouncement(announcement.id)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Badge
                              variant={
                                announcement.type === 'success' ? 'default' :
                                announcement.type === 'warning' ? 'destructive' : 'secondary'
                              }
                            >
                              {announcement.type === 'info' ? 'Info' :
                               announcement.type === 'warning' ? 'Attention' : 'Succès'}
                            </Badge>
                            <span className="text-sm text-gray-500 ml-2">
                              {new Date(announcement.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1">{announcement.title}</h4>
                          <p className="text-sm text-gray-600">{announcement.content}</p>
                        </div>
                        <div className="flex space-x-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAnnouncement(announcement)
                              setAnnouncementForm({
                                title: announcement.title,
                                content: announcement.content,
                                type: announcement.type
                              })
                              setIsAnnouncementDialogOpen(true)
                            }}
                            disabled={saving}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteAnnouncement(announcement.id)}
                            className="text-red-600"
                            disabled={saving}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}