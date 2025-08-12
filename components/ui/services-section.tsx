'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Mail, MapPin, Users, Zap } from 'lucide-react'

export function ServicesSection() {
  const services = [
    {
      icon: Mail,
      title: "Communication directe",
      description: "Échangez directement avec nos formateurs et posez vos questions en temps réel pour un apprentissage personnalisé."
    },
    {
      icon: MapPin,
      title: "Localisation précise",
      description: "Trouvez facilement nos centres de formation et événements grâce à notre système de géolocalisation intégré."
    },
    {
      icon: Users,
      title: "Communauté active",
      description: "Rejoignez une communauté dynamique de croyants partageant les mêmes valeurs et objectifs spirituels."
    },
    {
      icon: Zap,
      title: "ULTRA RAPIDE AVEC NOTRE NOUVELLE TECHNOLOGIE",
      description: "Profitez d'une expérience d'apprentissage fluide et rapide grâce à notre plateforme technologique de pointe."
    }
  ]

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-4">
            Notre démarche
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <service.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 leading-tight">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}