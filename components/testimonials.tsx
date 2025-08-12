'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Quote } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  location: string
  content: string
  rating: number
  avatar: string
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/homepage')
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.homepage && data.homepage.testimonials) {
          // Parse sécurisé des témoignages
          let testimonialsData = []
          
          if (typeof data.homepage.testimonials === 'string') {
            try {
              testimonialsData = JSON.parse(data.homepage.testimonials)
            } catch (parseError) {
              console.warn('Erreur lors du parsing des témoignages:', parseError)
              testimonialsData = []
            }
          } else if (Array.isArray(data.homepage.testimonials)) {
            testimonialsData = data.homepage.testimonials
          }
          
          setTestimonials(Array.isArray(testimonialsData) ? testimonialsData : [])
        } else {
          setTestimonials([])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des témoignages:', error)
        setError(error instanceof Error ? error.message : 'Erreur inconnue')
        setTestimonials([])
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </section>
    )
  }

  // Afficher la section même s'il n'y a pas de témoignages
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-4">
            Témoignages de nos Étudiants
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Découvrez comment notre formation spirituelle a impacté la vie de nos frères et sœurs
          </p>
        </div>

        {error && (
          <div className="text-center mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-yellow-600">
                Erreur lors du chargement des témoignages
              </p>
            </div>
          </div>
        )}

        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                {/* Quote Icon */}
                <div className="absolute top-4 right-4 text-orange-200">
                  <Quote className="w-8 h-8" />
                </div>

                <CardContent className="p-6">
                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    {[...Array(Math.max(0, Math.min(5, testimonial.rating || 5)))].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar || '/default-avatar.png'}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/default-avatar.png'
                      }}
                    />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <Quote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Aucun témoignage disponible pour le moment.
              </p>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">
              Rejoignez notre Communauté
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Commencez votre parcours de formation spirituelle dès aujourd'hui et grandissez avec nous dans la foi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/modules"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-semibold transition-colors duration-300"
              >
                Commencer ma Formation
              </a>
              <a
                href="/modules"
                className="border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white px-8 py-3 rounded-full font-semibold transition-colors duration-300"
              >
                Découvrir les Modules
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}