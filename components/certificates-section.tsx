'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, Download, Calendar, CheckCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Certificate {
  id: string
  type: 'BRONZE' | 'SILVER' | 'GOLD'
  certificateNumber: string
  issuedAt: string
  module: {
    title: string
    order: number
  }
}

interface EligibleCertificate {
  type: 'BRONZE' | 'SILVER' | 'GOLD'
  requiredModules: number
}

export function CertificatesSection() {
  const { data: session } = useSession()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [eligibleCertificates, setEligibleCertificates] = useState<EligibleCertificate[]>([])
  const [completedModules, setCompletedModules] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchCertificates()
    }
  }, [session])

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/certificates')
      if (response.ok) {
        const data = await response.json()
        setCertificates(data.certificates || [])
        setEligibleCertificates(data.eligibleCertificates || [])
        setCompletedModules(data.completedModules || 0)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des certificats:', error)
    } finally {
      setLoading(false)
    }
  }

  const claimCertificate = async (type: string) => {
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        toast.success('Certificat obtenu avec succès !')
        fetchCertificates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'obtention du certificat')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'obtention du certificat')
    }
  }

  const getCertificateColor = (type: string) => {
    switch (type) {
      case 'BRONZE':
        return 'from-amber-400 to-amber-600'
      case 'SILVER':
        return 'from-gray-400 to-gray-600'
      case 'GOLD':
        return 'from-yellow-400 to-yellow-600'
      default:
        return 'from-blue-400 to-blue-600'
    }
  }

  const getCertificateName = (type: string) => {
    switch (type) {
      case 'BRONZE':
        return 'Certificat Bronze'
      case 'SILVER':
        return 'Certificat Argent'
      case 'GOLD':
        return 'Certificat Or'
      default:
        return 'Certificat'
    }
  }

  if (!session) return null

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Mes Certificats</h2>
          <p className="text-gray-600">
            Obtenez des certificats en complétant vos modules de formation
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {completedModules} modules complétés
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Certificats obtenus */}
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden">
              <div className={`h-32 bg-gradient-to-r ${getCertificateColor(certificate.type)} flex items-center justify-center`}>
                <Award className="w-16 h-16 text-white" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {getCertificateName(certificate.type)}
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Obtenu
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(certificate.issuedAt).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                    N° {certificate.certificateNumber}
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Certificats éligibles */}
          {eligibleCertificates.map((eligible) => (
            <Card key={eligible.type} className="overflow-hidden border-dashed border-2">
              <div className={`h-32 bg-gradient-to-r ${getCertificateColor(eligible.type)} opacity-50 flex items-center justify-center`}>
                <Award className="w-16 h-16 text-white" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {getCertificateName(eligible.type)}
                  <Badge className="bg-orange-100 text-orange-800">
                    Disponible
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Vous avez complété {completedModules} modules sur {eligible.requiredModules} requis.
                </p>
                <Button 
                  onClick={() => claimCertificate(eligible.type)}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  Obtenir le certificat
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Certificats futurs */}
          {[
            { type: 'BRONZE', required: 3 },
            { type: 'SILVER', required: 6 },
            { type: 'GOLD', required: 9 }
          ].filter(cert => 
            !certificates.some(c => c.type === cert.type) && 
            !eligibleCertificates.some(e => e.type === cert.type) &&
            completedModules < cert.required
          ).map((future) => (
            <Card key={future.type} className="overflow-hidden opacity-60">
              <div className={`h-32 bg-gradient-to-r ${getCertificateColor(future.type)} opacity-30 flex items-center justify-center`}>
                <Award className="w-16 h-16 text-white" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {getCertificateName(future.type)}
                  <Badge variant="secondary">
                    Verrouillé
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Complétez {future.required} modules pour débloquer ce certificat.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${getCertificateColor(future.type)}`}
                    style={{ width: `${Math.min(100, (completedModules / future.required) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {completedModules}/{future.required} modules
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {certificates.length === 0 && eligibleCertificates.length === 0 && (
          <div className="text-center py-8">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Aucun certificat disponible
            </h3>
            <p className="text-gray-500">
              Complétez vos premiers modules pour débloquer des certificats !
            </p>
          </div>
        )}
      </div>
    </section>
  )
}