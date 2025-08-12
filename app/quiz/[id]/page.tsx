'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  ArrowLeft, 
  ArrowRight,
  BookOpen,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Question {
  id: string
  question: string
  type: 'multiple_choice' | 'true_false'
  options?: string[]
  correctAnswer: number | boolean
  explanation: string
}

interface Quiz {
  id: string
  chapterId: string
  title: string
  questions: Question[]
  passingScore: number
  timeLimit: number
  chapter: {
    id: string
    title: string
    order: number
    module: {
      id: string
      title: string
      order: number
    }
  }
}

interface QuizResult {
  score: number
  passed: boolean
  completedAt: string
}

interface AlreadyCompletedResponse {
  error: string
  alreadyCompleted: true
  result: QuizResult
}

export default function QuizPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: number }>({})
  const [trueFalseAnswers, setTrueFalseAnswers] = useState<{ [key: string]: boolean }>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [alreadyCompleted, setAlreadyCompleted] = useState<QuizResult | null>(null)

  // Redirection si non connecté
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Charger les données du quiz
  useEffect(() => {
    if (session && params.id) {
      const fetchQuiz = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/quiz/${params.id}`)
          
          if (!response.ok) {
            const errorData = await response.json()
            
            // Cas spécial : quiz déjà complété
            if (errorData.alreadyCompleted) {
              const completedData = errorData as AlreadyCompletedResponse
              setAlreadyCompleted(completedData.result)
              toast.info('Vous avez déjà complété ce quiz')
              return
            }
            
            throw new Error(errorData.error || 'Erreur lors de la récupération du quiz')
          }
          
          const data = await response.json()
          setQuiz(data)
          setTimeLeft(data.timeLimit * 60) // Convertir en secondes
        } catch (error: any) {
          console.error('Erreur lors du chargement du quiz:', error)
          toast.error(error.message || 'Impossible de charger le quiz')
          router.push('/modules')
        } finally {
          setLoading(false)
        }
      }
      fetchQuiz()
    }
  }, [session, params.id, router])

  // Fonction pour soumettre le quiz
  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz || isSubmitting) return

    setIsSubmitting(true)

    try {
      let correctAnswers = 0
      quiz.questions.forEach(question => {
        if (question.type === 'multiple_choice') {
          if (answers[question.id] === question.correctAnswer) {
            correctAnswers++
          }
        } else if (question.type === 'true_false') {
          if (trueFalseAnswers[question.id] === question.correctAnswer) {
            correctAnswers++
          }
        }
      })

      const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100)
      setScore(finalScore)
      setShowResults(true)

      const passed = finalScore >= quiz.passingScore

      // Enregistrer le résultat du quiz
      const response = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: { ...answers, ...trueFalseAnswers }, 
          score: finalScore, 
          passed 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'enregistrement')
      }
      
      if (passed) {
        toast.success('Félicitations ! Vous avez réussi le QCM !')
      } else {
        toast.error(`Score insuffisant. Vous devez obtenir au moins ${quiz.passingScore}% pour valider le chapitre.`)
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement du résultat:', error)
      toast.error(error.message || 'Impossible d\'enregistrer le résultat du quiz')
    } finally {
      setIsSubmitting(false)
    }
  }, [quiz, answers, isSubmitting])

  // Timer
  useEffect(() => {
    if (!quizStarted || showResults || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizStarted, showResults, timeLeft, handleSubmitQuiz])

  const startQuiz = () => {
    setQuizStarted(true)
  }

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const handleTrueFalseChange = (questionId: string, answer: boolean) => {
    setTrueFalseAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return 'text-green-600'
    if (score >= passingScore * 0.8) return 'text-orange-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Loading state
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du quiz...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/modules"
            className="flex items-center text-blue-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux modules
          </Link>
          {quizStarted && !showResults && quiz && (
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-orange-600">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(timeLeft)}
              </Badge>
              <Badge variant="outline" className="text-blue-600">
                Question {currentQuestion + 1}/{quiz.questions.length}
              </Badge>
            </div>
          )}
        </div>

        {/* Quiz déjà complété */}
        {alreadyCompleted && (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  alreadyCompleted.passed ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {alreadyCompleted.passed ? (
                    <Award className="w-10 h-10 text-green-600" />
                  ) : (
                    <AlertCircle className="w-10 h-10 text-orange-600" />
                  )}
                </div>
                <CardTitle className="text-2xl text-blue-900">
                  Quiz déjà complété
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    alreadyCompleted.passed ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {alreadyCompleted.score}%
                  </div>
                  <p className="text-gray-600 mb-2">
                    {alreadyCompleted.passed ? 'Quiz réussi !' : 'Quiz non réussi'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Complété le {formatDate(alreadyCompleted.completedAt)}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Information :</h4>
                      <p className="text-sm text-blue-800">
                        Vous ne pouvez passer ce quiz qu'une seule fois par chapitre. 
                        {alreadyCompleted.passed 
                          ? ' Vous pouvez maintenant continuer vers le chapitre suivant.'
                          : ' Vous devrez revoir le contenu du chapitre si vous souhaitez progresser.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <Link href="/modules">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600">
                      Retour aux modules
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz non démarré */}
        {!alreadyCompleted && quiz && !quizStarted && (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-blue-900">
                  {quiz.title}
                </CardTitle>
                <div className="flex items-center justify-center space-x-4 mt-4">
                  <Badge variant="outline">
                    Module {quiz.chapter.module.order}: {quiz.chapter.module.title}
                  </Badge>
                  <Badge variant="outline">
                    Chapitre {quiz.chapter.order}: {quiz.chapter.title}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Instructions :</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• {quiz.questions.length} questions à choix multiples</li>
                    <li>• Temps limite : {quiz.timeLimit} minutes</li>
                    <li>• Score minimum requis : {quiz.passingScore}%</li>
                    <li>• Une seule tentative par chapitre</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-1">Important :</h4>
                      <p className="text-sm text-orange-800">
                        Vous devez réussir ce QCM pour débloquer le chapitre suivant. 
                        Assurez-vous d'avoir bien assimilé le contenu avant de commencer.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={startQuiz}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-3"
                >
                  Commencer le QCM
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Résultats du quiz */}
        {!alreadyCompleted && showResults && quiz && (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  score >= quiz.passingScore ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {score >= quiz.passingScore ? (
                    <Award className="w-10 h-10 text-green-600" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-600" />
                  )}
                </div>
                <CardTitle className="text-2xl text-blue-900">
                  Résultats du QCM
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(score, quiz.passingScore)}`}>
                    {score}%
                  </div>
                  <p className="text-gray-600">
                    {score >= quiz.passingScore ? 'Félicitations ! Vous avez réussi.' : 'Score insuffisant pour valider le chapitre.'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {quiz.questions.filter(q => answers[q.id] === q.correctAnswer).length}
                      </div>
                      <div className="text-sm text-gray-600">Bonnes réponses</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        {quiz.questions.length}
                      </div>
                      <div className="text-sm text-gray-600">Total questions</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-900">Détail des réponses :</h3>
                  {quiz.questions.map((question, index) => {
                    const userAnswer = question.type === 'multiple_choice' 
                      ? answers[question.id] 
                      : trueFalseAnswers[question.id]
                    const isCorrect = userAnswer === question.correctAnswer
                    
                    return (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 flex-1">
                            {index + 1}. {question.question}
                          </h4>
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 ml-2" />
                          )}
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">Votre réponse : </span>
                            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {userAnswer !== undefined ? 
                                (question.type === 'multiple_choice' 
                                  ? question.options?.[userAnswer as number] 
                                  : userAnswer ? 'Vrai' : 'Faux'
                                ) : 'Aucune réponse'}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p>
                              <span className="font-medium">Bonne réponse : </span>
                              <span className="text-green-600">
                                {question.type === 'multiple_choice' 
                                  ? question.options?.[question.correctAnswer as number]
                                  : question.correctAnswer ? 'Vrai' : 'Faux'}
                              </span>
                            </p>
                          )}
                          {question.explanation && (
                            <p className="text-gray-600 italic">
                              {question.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col space-y-3">
                  <Link href="/modules">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600">
                      Retour aux modules
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz en cours */}
        {!alreadyCompleted && quiz && quizStarted && !showResults && (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl text-blue-900">
                    Question {currentQuestion + 1} sur {quiz.questions.length}
                  </CardTitle>
                  <Badge variant="outline" className="text-orange-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTime(timeLeft)}
                  </Badge>
                </div>
                <Progress value={((currentQuestion + 1) / quiz.questions.length) * 100} className="h-2" />
              </CardHeader>
              
              <CardContent className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {quiz.questions[currentQuestion].question}
                </h3>

                {quiz.questions[currentQuestion].type === 'multiple_choice' ? (
                  <RadioGroup
                    value={answers[quiz.questions[currentQuestion].id]?.toString()}
                    onValueChange={(value) => 
                      handleAnswerChange(quiz.questions[currentQuestion].id, parseInt(value))
                    }
                  >
                    {quiz.questions[currentQuestion].options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                         onClick={() => handleTrueFalseChange(quiz.questions[currentQuestion].id, true)}>
                      <input
                        type="radio"
                        name={`tf-${currentQuestion}`}
                        checked={trueFalseAnswers[quiz.questions[currentQuestion].id] === true}
                        onChange={() => handleTrueFalseChange(quiz.questions[currentQuestion].id, true)}
                        className="text-green-500 focus:ring-green-500"
                      />
                      <Label className="flex-1 cursor-pointer text-lg font-medium text-green-600">
                        Vrai
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                         onClick={() => handleTrueFalseChange(quiz.questions[currentQuestion].id, false)}>
                      <input
                        type="radio"
                        name={`tf-${currentQuestion}`}
                        checked={trueFalseAnswers[quiz.questions[currentQuestion].id] === false}
                        onChange={() => handleTrueFalseChange(quiz.questions[currentQuestion].id, false)}
                        className="text-red-500 focus:ring-red-500"
                      />
                      <Label className="flex-1 cursor-pointer text-lg font-medium text-red-600">
                        Faux
                      </Label>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Précédent
                  </Button>

                  {currentQuestion === quiz.questions.length - 1 ? (
                    <Button
                      onClick={handleSubmitQuiz}
                      className="bg-green-500 hover:bg-green-600"
                      disabled={
                        (quiz.questions.filter(q => q.type === 'multiple_choice').length !== Object.keys(answers).length ||
                         quiz.questions.filter(q => q.type === 'true_false').length !== Object.keys(trueFalseAnswers).length) ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? 'Envoi en cours...' : 'Terminer le QCM'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                      disabled={
                        quiz.questions[currentQuestion].type === 'multiple_choice' 
                          ? answers[quiz.questions[currentQuestion].id] === undefined
                          : trueFalseAnswers[quiz.questions[currentQuestion].id] === undefined
                      }
                    >
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}