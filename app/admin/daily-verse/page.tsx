'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Book, Calendar as CalendarIcon, Save } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DailyVerse {
  verse: string
  reference: string
  date: string
}

export default function AdminDailyVersePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentVerse, setCurrentVerse] = useState<DailyVerse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [formData, setFormData] = useState({
    verse: '',
    reference: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchCurrentVerse()
  }, [session, status, router])

  const fetchCurrentVerse = async () => {
    try {
      const response = await fetch('/api/daily-verse')
      if (response.ok) {
        const data = await response.json()
        setCurrentVerse(data)
        setFormData({
          verse: data.verse || '',
          reference: data.reference || ''
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement du verset:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.verse.trim() || !formData.reference.trim()) {
      toast.error('Tous les champs sont obligatoires')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/daily-verse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verse: formData.verse.trim(),
          reference: formData.reference.trim(),
          date: selectedDate.toISOString()
        })
      })

      if (response.ok) {
        toast.success('Verset du jour mis à jour avec succès')
        fetchCurrentVerse()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
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
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Gestion du Verset du Jour</h1>
          <p className="text-gray-600 mt-2">Configurez le verset biblique affiché sur la page d'accueil</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="w-5 h-5 mr-2" />
                Nouveau Verset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, 'PPP', { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verse">Verset *</Label>
                  <Textarea
                    id="verse"
                    value={formData.verse}
                    onChange={(e) => setFormData(prev => ({ ...prev, verse: e.target.value }))}
                    rows={4}
                    placeholder="Tapez le verset biblique ici..."
                    required
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Référence *</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Ex: Jean 3:16"
                    required
                    disabled={saving}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder le verset'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Aperçu */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu du Verset Actuel</CardTitle>
            </CardHeader>
            <CardContent>
              {currentVerse ? (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Book className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm font-medium opacity-90">
                          Verset du jour
                        </span>
                      </div>
                      <blockquote className="text-lg font-medium leading-relaxed mb-3 italic">
                        "{currentVerse.verse}"
                      </blockquote>
                      <cite className="text-sm font-semibold opacity-90">
                        - {currentVerse.reference}
                      </cite>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Book className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun verset configuré</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Comment ça fonctionne :</h4>
                <ul className="space-y-1 text-blue-800">
                  <li>• Le verset du jour s'affiche automatiquement sur la page d'accueil</li>
                  <li>• Vous pouvez programmer des versets pour des dates futures</li>
                  <li>• Si aucun verset n'est configuré, un verset par défaut s'affiche</li>
                  <li>• Les versets sont mis à jour automatiquement chaque jour</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Conseils :</h4>
                <ul className="space-y-1 text-orange-800">
                  <li>• Choisissez des versets encourageants et inspirants</li>
                  <li>• Variez les thèmes : espoir, amour, foi, persévérance</li>
                  <li>• Vérifiez l'orthographe et la référence biblique</li>
                  <li>• Programmez plusieurs versets à l'avance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}