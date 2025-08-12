'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MessageCircle, HelpCircle, Book, Video, Users, Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function SupportPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simuler l'envoi du message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.')
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      })
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setIsSubmitting(false)
    }
  }

  const faqs = [
    {
      question: "Comment puis-je m'inscrire à la plateforme ?",
      answer: "Vous pouvez vous inscrire en cliquant sur le bouton 'Inscription' en haut de la page. Remplissez le formulaire avec vos informations personnelles et créez un mot de passe sécurisé."
    },
    {
      question: "Comment accéder aux modules de formation ?",
      answer: "Une fois connecté, rendez-vous dans la section 'Modules' pour voir tous les modules disponibles. Les modules se débloquent progressivement après validation du QCM du module précédent."
    },
    {
      question: "Que faire si j'ai oublié mon mot de passe ?",
      answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Entrez votre adresse email et vous recevrez un lien pour réinitialiser votre mot de passe."
    },
    {
      question: "Comment fonctionne le système de progression ?",
      answer: "Votre progression est automatiquement sauvegardée. Une vidéo est considérée comme terminée lorsque vous avez regardé 95% du contenu. Vous devez ensuite réussir le QCM avec un score minimum de 70% pour débloquer le module suivant."
    },
    {
      question: "Puis-je revoir un module déjà terminé ?",
      answer: "Oui, vous pouvez revoir tous les modules que vous avez déjà terminés à tout moment depuis votre espace personnel."
    },
    {
      question: "Comment modifier mes informations personnelles ?",
      answer: "Rendez-vous dans votre profil en cliquant sur votre nom en haut à droite, puis sur 'Profil'. Vous pourrez y modifier vos informations personnelles."
    },
    {
      question: "Les vidéos sont-elles disponibles hors ligne ?",
      answer: "Actuellement, les vidéos ne sont disponibles qu'en ligne. Assurez-vous d'avoir une connexion internet stable pour une expérience optimale."
    },
    {
      question: "Comment contacter le support technique ?",
      answer: "Vous pouvez nous contacter via le formulaire ci-dessous, par email à support@eglise-celeste.org, ou par téléphone au +229 01 00 00 00 00."
    }
  ]

  const supportCategories = [
    {
      icon: Book,
      title: "Contenu et Modules",
      description: "Questions sur les modules de formation et le contenu spirituel"
    },
    {
      icon: Video,
      title: "Problèmes Techniques",
      description: "Difficultés avec la lecture des vidéos ou l'utilisation de la plateforme"
    },
    {
      icon: Users,
      title: "Compte Utilisateur",
      description: "Gestion de votre compte, mot de passe, informations personnelles"
    },
    {
      icon: Settings,
      title: "Fonctionnalités",
      description: "Questions sur l'utilisation des différentes fonctionnalités"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Header />
      <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Centre d'Aide et Support</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nous sommes là pour vous accompagner dans votre parcours de formation spirituelle. 
            Trouvez des réponses à vos questions ou contactez-nous directement.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="w-6 h-6 mr-2 text-orange-500" />
                  Questions Fréquemment Posées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Categories d'aide */}
            <Card>
              <CardHeader>
                <CardTitle>Catégories d'Aide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportCategories.map((category, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <category.icon className="w-6 h-6 text-orange-500 mt-1" />
                        <div>
                          <h3 className="font-semibold text-blue-900 mb-1">{category.title}</h3>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            {/* Informations de contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-6 h-6 mr-2 text-orange-500" />
                  Nous Contacter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">support@eglise-celeste.org</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <p className="text-sm text-gray-600">+229 01 00 00 00 00</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Heures d'ouverture :</strong><br />
                    Lundi - Vendredi : 8h00 - 18h00<br />
                    Samedi : 9h00 - 15h00<br />
                    Dimanche : Fermé
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Formulaire de contact */}
            <Card>
              <CardHeader>
                <CardTitle>Envoyer un Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <select
                      id="category"
                      value={contactForm.category}
                      onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="general">Question générale</option>
                      <option value="technical">Problème technique</option>
                      <option value="content">Contenu des modules</option>
                      <option value="account">Compte utilisateur</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Status du service */}
            <Card>
              <CardHeader>
                <CardTitle>État du Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Plateforme</span>
                    <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vidéos</span>
                    <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">QCM</span>
                    <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Support</span>
                    <Badge className="bg-green-100 text-green-800">Disponible</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}