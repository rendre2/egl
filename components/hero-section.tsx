'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

// Types définis localement pour éviter les erreurs d'import
interface HomepageData {
  id: string
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  testimonials: any[]
  announcements: any[]
  featuredModules: any[]
  testimonialsTitle?: string
  testimonialsSubtitle?: string
  ctaTitle?: string
  ctaSubtitle?: string
}

interface Stats {
  totalUsers: number
  totalModules: number
  successRate: number
}

export function HeroSection() {
  const { data: session } = useSession()
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Données par défaut
  const defaultHomepageData: HomepageData = {
    id: "default",
    heroTitle: "Notre proposition",
    heroSubtitle: "Bienvenue dans le domaine d'Israël chrétien dédié à l'enseignement spirituel et à l'édification communautaire !",
    heroImage: "heros.jpg",
    testimonials: [],
    announcements: [],
    featuredModules: [],
    testimonialsTitle: "Témoignages de nos Étudiants",
    testimonialsSubtitle: "Découvrez comment notre formation spirituelle a impacté la vie de nos frères et sœurs",
    ctaTitle: "Rejoignez notre Communauté",
    ctaSubtitle: "Commencez votre parcours de formation spirituelle dès aujourd'hui et grandissez avec nous dans la foi."
  }

  const defaultStats: Stats = { 
    totalUsers: 150, 
    totalModules: 12, 
    successRate: 95 
  }

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setError(null)
        
        const response = await fetch('/api/homepage')
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!data || !data.homepage) {
          setHomepageData(defaultHomepageData)
        } else {
          const parseJsonSafely = (jsonString: any, defaultValue: any[] = []) => {
            if (!jsonString) return defaultValue
            if (typeof jsonString === 'object') return Array.isArray(jsonString) ? jsonString : defaultValue
            try {
              const parsed = JSON.parse(jsonString)
              return Array.isArray(parsed) ? parsed : defaultValue
            } catch {
              console.warn('Erreur lors du parsing JSON, utilisation de la valeur par défaut')
              return defaultValue
            }
          }

          setHomepageData({
            ...data.homepage,
            testimonials: parseJsonSafely(data.homepage.testimonials),
            announcements: parseJsonSafely(data.homepage.announcements),
            featuredModules: parseJsonSafely(data.homepage.featuredModules)
          })
        }
        
        setStats(data?.stats || defaultStats)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Erreur lors du chargement des données'
        
        console.error('Erreur lors du chargement des données:', error)
        setError(errorMessage)
        
        // Utiliser les données par défaut en cas d'erreur
        setHomepageData(defaultHomepageData)
        setStats(defaultStats)
      }
    }

    fetchHomepageData()
  }, [])

  // Utiliser les données actuelles ou les données par défaut
  const currentHomepageData = homepageData || defaultHomepageData
  const currentStats = stats || defaultStats

  return (
    <section className="relative bg-white dark:bg-gray-900 py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contenu textuel */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-blue-900 dark:text-blue-100 leading-tight">
                {currentHomepageData.heroTitle}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                {currentHomepageData.heroSubtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {session ? (
                <Link href="/modules">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <Play className="w-6 h-6 mr-3" />
                    Continuer ma Formation
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <Play className="w-6 h-6 mr-3" />
                    Commencer ma Formation
                  </Button>
                </Link>
              )}
              <Link href="/modules">
                <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <BookOpen className="w-6 h-6 mr-3" />
                  Découvrir les Modules
                </Button>
              </Link>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {currentStats.totalUsers}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Étudiants Actifs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {currentStats.totalModules}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Modules Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {currentStats.successRate}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Taux de Réussite</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={currentHomepageData.heroImage}
                alt="Formation spirituelle"
                className="w-full h-[500px] object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "heros.jpg"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            
            {/* Éléments décoratifs */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500 rounded-full opacity-20 animate-pulse delay-300"></div>
          </div>
        </div>

        {/* Message d'erreur discret (optionnel) */}
        {error && (
          <div className="mt-4 p-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-md text-center">
            Les données sont en cours de chargement, affichage du contenu par défaut.
          </div>
        )}
      </div>
    </section>
  )
}