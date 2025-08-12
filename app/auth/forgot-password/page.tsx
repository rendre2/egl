'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsEmailSent(true)
        toast.success('Email de réinitialisation envoyé')
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi de l\'email')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/auth/signin"
          className="inline-flex items-center text-blue-600 hover:text-orange-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la connexion
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center">
              {isEmailSent ? (
                <CheckCircle className="text-white w-8 h-8" />
              ) : (
                <Mail className="text-white w-8 h-8" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-blue-900">
              {isEmailSent ? 'Email Envoyé' : 'Mot de Passe Oublié'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isEmailSent 
                ? 'Vérifiez votre boîte email pour les instructions de réinitialisation'
                : 'Entrez votre adresse email pour recevoir un lien de réinitialisation'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isEmailSent ? (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    Un email de réinitialisation a été envoyé à <strong>{email}</strong>
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Vous n'avez pas reçu l'email ?</p>
                  <button
                    onClick={() => {
                      setIsEmailSent(false)
                      setEmail('')
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={isLoading}
                >
                  {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </Button>
              </form>
            )}

            <div className="text-center">
              <Link
                href="/auth/signin"
                className="text-sm text-blue-600 hover:text-orange-600 transition-colors"
              >
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}