'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Video, Headphones, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Content {
  id: string
  chapterId: string
  title: string
  description?: string
  type: 'VIDEO' | 'AUDIO'
  url: string
  duration: number
  order: number
  isActive: boolean
  chapter: {
    title: string
    order: number
    module: {
      title: string
      order: number
    }
  }
  _count: {
    contentProgress: number
  }
}

interface Chapter {
  id: string
  title: string
  order: number
  module: {
    title: string
    order: number
  }
}

export default function AdminContentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contents, setContents] = useState<Content[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [formData, setFormData] = useState({
    chapterId: '',
    title: '',
    description: '',
    type: 'VIDEO' as 'VIDEO' | 'AUDIO',
    url: '',
    duration: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contentsRes, chaptersRes] = await Promise.all([
        fetch('/api/admin/contents'),
        fetch('/api/admin/chapters')
      ])
      
      if (contentsRes.ok) {
        const contentsData = await contentsRes.json()
        setContents(contentsData.contents || [])
      }
      
      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json()
        setChapters(chaptersData.chapters || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.chapterId || !formData.title.trim() || !formData.url.trim() || formData.duration <= 0) {
      toast.error('Tous les champs obligatoires doivent être remplis')
      return
    }
    
    setSubmitting(true)

    try {
      const url = editingContent ? `/api/admin/contents/${editingContent.id}` : '/api/admin/contents'
      const method = editingContent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(responseData.message || (editingContent ? 'Contenu mis à jour' : 'Contenu créé'))
      setIsDialogOpen(false)
      resetForm()
      await fetchData()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setEditingContent(null)
    setFormData({
      chapterId: '',
      title: '',
      description: '',
      type: 'VIDEO',
      url: '',
      duration: 0
    })
  }

  const handleEdit = (content: Content) => {
    setEditingContent(content)
    setFormData({
      chapterId: content.chapterId,
      title: content.title,
      description: content.description || '',
      type: content.type,
      url: content.url,
      duration: content.duration
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (contentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) return

    try {
      const response = await fetch(`/api/admin/contents/${contentId}`, {
        method: 'DELETE',
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur lors de la suppression')
      }

      toast.success('Contenu supprimé avec succès')
      await fetchData()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`
  }

  const getContentIcon = (type: string) => {
    return type === 'VIDEO' ? 
      <Video className="w-4 h-4 text-blue-500" /> : 
      <Headphones className="w-4 h-4 text-purple-500" />
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Gestion des Contenus</h1>
            <p className="text-gray-600 mt-2">Ajoutez des vidéos et audios à vos chapitres</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Contenu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingContent ? 'Modifier le Contenu' : 'Nouveau Contenu'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="chapterId">Chapitre *</Label>
                  <Select
                    value={formData.chapterId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, chapterId: value }))}
                    disabled={editingContent !== null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un chapitre" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          Module {chapter.module.order} - Chapitre {chapter.order}: {chapter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Titre du contenu"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'VIDEO' | 'AUDIO') => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIDEO">Vidéo</SelectItem>
                        <SelectItem value="AUDIO">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du contenu (optionnel)"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL du {formData.type === 'VIDEO' ? 'vidéo' : 'audio'} *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (en secondes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {formData.duration > 0 && `≈ ${formatDuration(formData.duration)}`}
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={submitting}
                  >
                    {submitting ? 'Enregistrement...' : (editingContent ? 'Mettre à jour' : 'Créer')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Contenus ({contents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {contents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun contenu créé pour le moment.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module/Chapitre</TableHead>
                    <TableHead>Contenu</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Étudiants</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contents.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            Module {content.chapter.module.order}
                          </Badge>
                          <div className="text-sm font-medium">
                            Chapitre {content.chapter.order}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {content.chapter.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center">
                            <span className="mr-2">#{content.order}</span>
                            {content.title}
                          </div>
                          {content.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {content.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getContentIcon(content.type)}
                          <span className="ml-2 text-sm">
                            {content.type === 'VIDEO' ? 'Vidéo' : 'Audio'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDuration(content.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-gray-400" />
                          {content._count.contentProgress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(content)}
                            title="Modifier le contenu"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(content.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer le contenu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}