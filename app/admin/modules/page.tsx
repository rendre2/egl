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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, Eye, BookOpen, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Module {
  id: string
  title: string
  description: string
  thumbnail?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    moduleProgress: number
    chapters: number
  }
}

export default function AdminModulesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    isActive: true
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchModules()
  }, [session, status, router])

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/admin/modules')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setModules(data.modules || [])
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error)
      toast.error('Erreur lors du chargement des modules')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation côté client
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)

    try {
      const url = editingModule ? `/api/admin/modules/${editingModule.id}` : '/api/admin/modules'
      const method = editingModule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          thumbnail: formData.thumbnail.trim() || null,
          isActive: formData.isActive
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(editingModule ? 'Module mis à jour' : 'Module créé avec succès')
      setIsDialogOpen(false)
      resetForm()
      await fetchModules()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingModule(null)
    setFormData({
      title: '',
      description: '',
      thumbnail: '',
      isActive: true
    })
  }

  const handleEdit = (module: Module) => {
    setEditingModule(module)
    setFormData({
      title: module.title,
      description: module.description,
      thumbnail: module.thumbnail || '',
      isActive: module.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (moduleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce module ? Cette action supprimera également tous ses chapitres, contenus et progressions associées. Cette action est irréversible.')) return

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      toast.success('Module supprimé avec succès')
      await fetchModules()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  const toggleActive = async (moduleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }

      toast.success(`Module ${isActive ? 'activé' : 'désactivé'}`)
      await fetchModules()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour')
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      resetForm()
    }
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
            <h1 className="text-3xl font-bold text-blue-900">Gestion des Modules</h1>
            <p className="text-gray-600 mt-2">Gérez les modules de formation spirituelle</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Module
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingModule ? 'Modifier le Module' : 'Nouveau Module'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    maxLength={200}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={1000}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">URL de la miniature</Label>
                  <Input
                    id="thumbnail"
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Module actif</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading ? 'Chargement...' : (editingModule ? 'Mettre à jour' : 'Créer')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Modules ({modules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun module trouvé. Créez votre premier module !
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Chapitres</TableHead>
                    <TableHead>Étudiants</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>
                        <Badge variant="outline">#{module.order}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{module.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {module.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1 text-gray-400" />
                          {module._count?.chapters || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-gray-400" />
                          {module._count?.moduleProgress || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={module.isActive}
                            onCheckedChange={(checked) => toggleActive(module.id, checked)}
                          />
                          <Badge variant={module.isActive ? 'default' : 'secondary'}>
                            {module.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/modules/${module.id}`)}
                            title="Voir le module"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(module)}
                            title="Modifier le module"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(module.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer le module"
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