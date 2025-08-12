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
import { Plus, Edit, Trash2, BookOpen, Video, Headphones, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Chapter {
  id: string
  moduleId: string
  title: string
  description: string
  order: number
  isActive: boolean
  module: {
    title: string
    order: number
  }
  contents: Array<{
    id: string
    title: string
    type: 'VIDEO' | 'AUDIO'
    duration: number
  }>
  quiz?: {
    id: string
    title: string
    passingScore: number
  }
  _count: {
    contents: number
    chapterProgress: number
  }
}

interface Module {
  id: string
  title: string
  order: number
}

export default function AdminChaptersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [formData, setFormData] = useState({
    moduleId: '',
    title: '',
    description: ''
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
      const [chaptersRes, modulesRes] = await Promise.all([
        fetch('/api/admin/chapters'),
        fetch('/api/admin/modules')
      ])
      
      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json()
        setChapters(chaptersData.chapters || [])
      }
      
      if (modulesRes.ok) {
        const modulesData = await modulesRes.json()
        setModules(modulesData.modules || [])
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
    
    if (!formData.moduleId || !formData.title.trim() || !formData.description.trim()) {
      toast.error('Tous les champs sont obligatoires')
      return
    }
    
    setSubmitting(true)

    try {
      const url = editingChapter ? `/api/admin/chapters/${editingChapter.id}` : '/api/admin/chapters'
      const method = editingChapter ? 'PUT' : 'POST'

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

      toast.success(responseData.message || (editingChapter ? 'Chapitre mis à jour' : 'Chapitre créé'))
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
    setEditingChapter(null)
    setFormData({
      moduleId: '',
      title: '',
      description: ''
    })
  }

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setFormData({
      moduleId: chapter.moduleId,
      title: chapter.title,
      description: chapter.description
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (chapterId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chapitre ?')) return

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'DELETE',
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur lors de la suppression')
      }

      toast.success('Chapitre supprimé avec succès')
      await fetchData()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  const getTotalDuration = (contents: Chapter['contents']) => {
    return contents.reduce((total, content) => total + content.duration, 0)
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Gestion des Chapitres</h1>
            <p className="text-gray-600 mt-2">Organisez vos modules en chapitres</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Chapitre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingChapter ? 'Modifier le Chapitre' : 'Nouveau Chapitre'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="moduleId">Module *</Label>
                  <Select
                    value={formData.moduleId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, moduleId: value }))}
                    disabled={editingChapter !== null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          Module {module.order}: {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du Chapitre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Introduction aux fondements"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du chapitre..."
                    rows={3}
                    required
                  />
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
                    {submitting ? 'Enregistrement...' : (editingChapter ? 'Mettre à jour' : 'Créer')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Chapitres ({chapters.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {chapters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun chapitre créé pour le moment.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Chapitre</TableHead>
                    <TableHead>Contenus</TableHead>
                    <TableHead>Durée totale</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Étudiants</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chapters.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell>
                        <Badge variant="outline">
                          Module {chapter.module.order}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                          {chapter.module.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            Chapitre {chapter.order}: {chapter.title}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {chapter.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <Video className="w-4 h-4 mr-1 text-blue-500" />
                            <span className="text-sm">
                              {chapter.contents.filter(c => c.type === 'VIDEO').length}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Headphones className="w-4 h-4 mr-1 text-purple-500" />
                            <span className="text-sm">
                              {chapter.contents.filter(c => c.type === 'AUDIO').length}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {chapter._count.contents} total
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDuration(getTotalDuration(chapter.contents))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {chapter.quiz ? (
                          <Badge className="bg-green-100 text-green-800">
                            <HelpCircle className="w-3 h-3 mr-1" />
                            Configuré
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Aucun quiz
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {chapter._count.chapterProgress}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(chapter)}
                            title="Modifier le chapitre"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(chapter.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer le chapitre"
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