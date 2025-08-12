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
import { Plus, Edit, Trash2, HelpCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id?: string
  question: string
  type: 'multiple_choice' | 'true_false'
  options?: string[]
  correctAnswer: number | boolean
  explanation?: string
}

interface Quiz {
  id: string
  chapterId: string
  title: string
  questions: Question[]
  passingScore: number
  chapter: {
    title: string
    order: number
    module: {
      title: string
      order: number
    }
  }
  _count?: {
    results: number
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

interface Module {
  id: string
  title: string
  order: number
}

interface ApiResponse {
  quizzes?: Quiz[]
  modules?: Module[]
  chapters?: Chapter[]
  success?: boolean
  error?: string
  message?: string
}

export default function AdminQuizPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [formData, setFormData] = useState({
    chapterId: '',
    title: '',
    passingScore: 70,
    questions: [
      {
        question: '',
        type: 'multiple_choice' as 'multiple_choice' | 'true_false',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      }
    ] as Question[]
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
      const [quizzesRes, modulesRes] = await Promise.all([
        fetch('/api/admin/quiz'),
        fetch('/api/admin/chapters')
      ])
      
      if (!quizzesRes.ok) {
        const errorData = await quizzesRes.json()
        throw new Error(errorData.error || 'Erreur lors du chargement des QCM')
      }
      
      if (!modulesRes.ok) {
        const errorData = await modulesRes.json()
        throw new Error(errorData.error || 'Erreur lors du chargement des chapitres')
      }

      const quizzesData: ApiResponse = await quizzesRes.json()
      const modulesData: ApiResponse = await modulesRes.json()
      
      const loadedQuizzes = quizzesData.quizzes || []
      const loadedChapters = modulesData.chapters || []
      
      // S'assurer que les questions sont bien typées
      const formattedQuizzes = loadedQuizzes.map(quiz => ({
        ...quiz,
        questions: Array.isArray(quiz.questions) ? quiz.questions : []
      }))
      
      setQuizzes(formattedQuizzes)
      setChapters(loadedChapters)
      
      // Filtrer les chapitres qui n'ont pas encore de quiz
      const usedChapterIds = new Set(formattedQuizzes.map(q => q.chapterId))
      setAvailableChapters(loadedChapters.filter(c => !usedChapterIds.has(c.id)))
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): string | null => {
    if (!formData.chapterId.trim()) {
      return 'Veuillez sélectionner un chapitre'
    }
    
    if (!formData.title.trim()) {
      return 'Le titre est obligatoire'
    }
    
    if (formData.passingScore < 0 || formData.passingScore > 100) {
      return 'Le score minimum doit être entre 0 et 100'
    }
    
    if (formData.questions.length === 0) {
      return 'Au moins une question est requise'
    }
    
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i]
      
      if (!question.question.trim()) {
        return `La question ${i + 1} ne peut pas être vide`
      }
      
      if (question.type === 'multiple_choice') {
        if (!question.options || question.options.some(opt => !opt.trim())) {
          return `Toutes les options de la question ${i + 1} doivent être remplies`
        }
        if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
          return `Veuillez sélectionner une réponse correcte pour la question ${i + 1}`
        }
      } else if (question.type === 'true_false') {
        if (typeof question.correctAnswer !== 'boolean') {
          return `Veuillez sélectionner Vrai ou Faux pour la question ${i + 1}`
        }
      }
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }
    
    setSubmitting(true)

    try {
      const url = editingQuiz ? `/api/admin/quiz/${editingQuiz.id}` : '/api/admin/quiz'
      const method = editingQuiz ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          questions: formData.questions.map(q => ({
            ...q,
            question: q.question.trim(),
            options: q.type === 'multiple_choice' ? q.options?.map(opt => opt.trim()) : undefined,
            explanation: q.explanation?.trim() || ''
          }))
        }),
      })

      const responseData: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(responseData.message || (editingQuiz ? 'QCM mis à jour avec succès' : 'QCM créé avec succès'))
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
    setEditingQuiz(null)
    setFormData({
      chapterId: '',
      title: '',
      passingScore: 70,
      questions: [
        {
          question: '',
          type: 'multiple_choice',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        }
      ]
    })
  }

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setFormData({
      chapterId: quiz.chapterId,
      title: quiz.title,
      passingScore: quiz.passingScore,
      questions: quiz.questions.map(q => ({ 
        ...q,
        options: [...(q.options ?? [])], 
        explanation: q.explanation || ''
      }))
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId)
    const confirmMessage = quiz?._count?.results 
      ? `Ce QCM a ${quiz._count.results} résultats enregistrés. Êtes-vous sûr de vouloir le supprimer ?`
      : 'Êtes-vous sûr de vouloir supprimer ce QCM ?'
      
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/admin/quiz/${quizId}`, {
        method: 'DELETE',
      })

      const responseData: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur lors de la suppression')
      }

      toast.success(responseData.message || 'QCM supprimé avec succès')
      await fetchData()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  const addQuestion = () => {
    if (formData.questions.length >= 20) {
      toast.error('Maximum 20 questions par QCM')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          type: 'multiple_choice' as 'multiple_choice' | 'true_false',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        }
      ]
    }))
  }

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      setFormData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }))
    } else {
      toast.error('Au moins une question est requise')
    }
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: q.options?.map((opt, j) => j === optionIndex ? value : opt) }
          : q
      )
    }))
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open && !submitting) {
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
            <h1 className="text-3xl font-bold text-blue-900">Gestion des QCM</h1>
            <p className="text-gray-600 mt-2">Créez et gérez les questionnaires de validation</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                disabled={availableChapters.length === 0 && !editingQuiz}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau QCM
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuiz ? 'Modifier le QCM' : 'Nouveau QCM'}
                </DialogTitle>
              </DialogHeader>
              
              {availableChapters.length === 0 && !editingQuiz && (
                <div className="flex items-center p-4 mb-4 text-sm text-amber-800 border border-amber-300 rounded-lg bg-amber-50">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>Tous les chapitres ont déjà un QCM associé.</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapterId">Chapitre *</Label>
                    <Select
                      value={formData.chapterId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, chapterId: value }))}
                      disabled={editingQuiz !== null}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un chapitre" />
                      </SelectTrigger>
                      <SelectContent>
                        {editingQuiz ? (
                          <SelectItem value={editingQuiz.chapterId}>
                            Module {editingQuiz.chapter.module.order} - Chapitre {editingQuiz.chapter.order}: {editingQuiz.chapter.title}
                          </SelectItem>
                        ) : (
                          availableChapters.map((chapter) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              Module {chapter.module.order} - Chapitre {chapter.order}: {chapter.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passingScore">Score minimum (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingScore}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        passingScore: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                      }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du QCM *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Quiz de validation du module"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Questions ({formData.questions.length})</h3>
                    <Button 
                      type="button" 
                      onClick={addQuestion} 
                      variant="outline" 
                      size="sm"
                      disabled={formData.questions.length >= 20}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une question
                    </Button>
                  </div>

                  {formData.questions.map((question, questionIndex) => (
                    <Card key={questionIndex} className="p-4 border-l-4 border-l-orange-500">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <Label className="text-base font-medium">
                            Question {questionIndex + 1}
                          </Label>
                          {formData.questions.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeQuestion(questionIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <Textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                          placeholder="Tapez votre question ici..."
                          rows={2}
                          maxLength={500}
                          required
                        />

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Type de question</Label>
                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`type-${questionIndex}`}
                                checked={question.type === 'multiple_choice'}
                                onChange={() => {
                                  updateQuestion(questionIndex, 'type', 'multiple_choice')
                                  updateQuestion(questionIndex, 'options', ['', '', '', ''])
                                  updateQuestion(questionIndex, 'correctAnswer', 0)
                                }}
                                className="text-orange-500 focus:ring-orange-500"
                              />
                              <span className="text-sm">Choix multiples</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`type-${questionIndex}`}
                                checked={question.type === 'true_false'}
                                onChange={() => {
                                  updateQuestion(questionIndex, 'type', 'true_false')
                                  updateQuestion(questionIndex, 'options', undefined)
                                  updateQuestion(questionIndex, 'correctAnswer', true)
                                }}
                                className="text-orange-500 focus:ring-orange-500"
                              />
                              <span className="text-sm">Vrai/Faux</span>
                            </label>
                          </div>
                        </div>
                        {question.type === 'multiple_choice' ? (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Options (sélectionnez la bonne réponse)</Label>
                            <div className="grid grid-cols-1 gap-2">
                              {question.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-3 p-2 border rounded">
                                  <input
                                    type="radio"
                                    name={`correct-${questionIndex}`}
                                    checked={question.correctAnswer === optionIndex}
                                    onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                                    className="text-orange-500 focus:ring-orange-500"
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                    maxLength={200}
                                    className="flex-1"
                                    required
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Réponse correcte</Label>
                            <div className="flex space-x-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`tf-correct-${questionIndex}`}
                                  checked={question.correctAnswer === true}
                                  onChange={() => updateQuestion(questionIndex, 'correctAnswer', true)}
                                  className="text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-green-600">Vrai</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`tf-correct-${questionIndex}`}
                                  checked={question.correctAnswer === false}
                                  onChange={() => updateQuestion(questionIndex, 'correctAnswer', false)}
                                  className="text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-red-600">Faux</span>
                              </label>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-sm">Explication (optionnel)</Label>
                          <Textarea
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                            placeholder="Explication de la bonne réponse..."
                            rows={2}
                            maxLength={300}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={submitting}
                  >
                    {submitting ? 'Enregistrement...' : (editingQuiz ? 'Mettre à jour' : 'Créer')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des QCM ({quizzes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun QCM créé pour le moment.</p>
                <p className="text-sm">Créez votre premier questionnaire !</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module/Chapitre</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Score minimum</TableHead>
                    <TableHead>Résultats</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            Module {quiz.chapter.module.order}
                          </Badge>
                          <div className="text-sm font-medium">
                            Chapitre {quiz.chapter.order}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {quiz.chapter.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate" title={quiz.title}>
                          {quiz.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <HelpCircle className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-sm">
                            {quiz.questions?.length || 0} question{(quiz.questions?.length || 0) > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {quiz.questions?.filter(q => q.type === 'multiple_choice').length || 0} QCM, {' '}
                          {quiz.questions?.filter(q => q.type === 'true_false').length || 0} V/F
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{quiz.passingScore}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {quiz._count?.results || 0} résultat{(quiz._count?.results || 0) > 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(quiz)}
                            title="Modifier le QCM"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(quiz.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer le QCM"
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