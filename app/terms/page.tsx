'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Shield, AlertTriangle, Scale, Mail } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Header />
      <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
            <FileText className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Conditions d'Utilisation</h1>
          <p className="text-xl text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-6 h-6 mr-2 text-orange-500" />
                Acceptation des conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Bienvenue sur la plateforme de formation spirituelle de l'Église Céleste. En accédant à 
                notre site web et en utilisant nos services, vous acceptez d'être lié par ces conditions 
                d'utilisation et toutes les lois et réglementations applicables.
              </p>
              <p>
                Si vous n'acceptez pas l'une de ces conditions, vous n'êtes pas autorisé à utiliser ou 
                accéder à ce site. Les matériaux contenus dans ce site web sont protégés par les lois 
                applicables sur le droit d'auteur et les marques de commerce.
              </p>
            </CardContent>
          </Card>

          {/* Utilisation de la plateforme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 mr-2 text-orange-500" />
                Utilisation de la plateforme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Accès aux services</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>L'accès à la plateforme nécessite une inscription préalable</li>
                  <li>Vous devez fournir des informations exactes et complètes lors de l'inscription</li>
                  <li>Vous êtes responsable de maintenir la confidentialité de vos identifiants</li>
                  <li>Un seul compte par personne est autorisé</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Utilisation appropriée</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Utiliser la plateforme uniquement à des fins de formation spirituelle</li>
                  <li>Respecter les autres utilisateurs et maintenir un comportement approprié</li>
                  <li>Ne pas partager vos identifiants de connexion avec d'autres personnes</li>
                  <li>Ne pas tenter de contourner les mesures de sécurité</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Comportements interdits</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Télécharger, copier ou redistribuer le contenu sans autorisation</li>
                  <li>Utiliser des robots, scripts ou autres moyens automatisés</li>
                  <li>Tenter d'accéder aux comptes d'autres utilisateurs</li>
                  <li>Publier du contenu offensant, illégal ou inapproprié</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Propriété intellectuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-6 h-6 mr-2 text-orange-500" />
                Propriété intellectuelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Contenu de la plateforme</h3>
                  <p className="text-gray-600">
                    Tout le contenu présent sur cette plateforme, incluant mais non limité aux textes, 
                    vidéos, images, logos, et matériel de formation, est la propriété exclusive de 
                    l'Église Céleste ou de ses partenaires autorisés.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Licence d'utilisation</h3>
                  <p className="text-gray-600">
                    Nous vous accordons une licence limitée, non exclusive et non transférable pour 
                    accéder et utiliser le contenu de formation à des fins personnelles et éducatives 
                    uniquement.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Restrictions</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Reproduction ou distribution du contenu interdite</li>
                    <li>Modification ou création d'œuvres dérivées interdite</li>
                    <li>Utilisation commerciale du contenu interdite</li>
                    <li>Suppression des mentions de droits d'auteur interdite</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsabilités */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="w-6 h-6 mr-2 text-orange-500" />
                Responsabilités et limitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Vos responsabilités</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Maintenir la sécurité de votre compte</li>
                    <li>Utiliser la plateforme conformément à ces conditions</li>
                    <li>Respecter les droits de propriété intellectuelle</li>
                    <li>Signaler tout problème ou abus constaté</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Nos responsabilités</h3>
                  <p className="text-gray-600">
                    Nous nous efforçons de maintenir la plateforme accessible et fonctionnelle, mais 
                    nous ne garantissons pas un service ininterrompu. Nous nous réservons le droit de 
                    modifier, suspendre ou interrompre tout ou partie du service à tout moment.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Limitation de responsabilité</h3>
                  <p className="text-gray-600">
                    L'Église Céleste ne saurait être tenue responsable des dommages directs ou indirects 
                    résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme, sauf en 
                    cas de faute lourde ou de dol de notre part.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confidentialité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-6 h-6 mr-2 text-orange-500" />
                Protection des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                La collecte et l'utilisation de vos données personnelles sont régies par notre 
                Politique de Confidentialité, qui fait partie intégrante de ces conditions d'utilisation.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Important :</strong> En utilisant notre plateforme, vous consentez à la 
                  collecte et à l'utilisation de vos informations conformément à notre Politique de 
                  Confidentialité.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Suspension et résiliation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
                Suspension et résiliation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Suspension de compte</h3>
                  <p className="text-gray-600">
                    Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de 
                    violation de ces conditions d'utilisation, sans préavis et à notre seule discrétion.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Motifs de suspension</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Violation des conditions d'utilisation</li>
                    <li>Comportement inapproprié ou abusif</li>
                    <li>Tentative de piratage ou d'accès non autorisé</li>
                    <li>Utilisation frauduleuse de la plateforme</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Résiliation par l'utilisateur</h3>
                  <p className="text-gray-600">
                    Vous pouvez résilier votre compte à tout moment en nous contactant. La résiliation 
                    entraîne la perte d'accès à tous les contenus et données associés à votre compte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modifications */}
          <Card>
            <CardHeader>
              <CardTitle>Modifications des conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Nous nous réservons le droit de réviser ces conditions d'utilisation à tout moment sans 
                préavis. En utilisant ce site web, vous acceptez d'être lié par la version actuelle de 
                ces conditions d'utilisation.
              </p>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-orange-800 text-sm">
                  <strong>Notification :</strong> Les modifications importantes seront communiquées via 
                  email ou notification sur la plateforme. Il est de votre responsabilité de consulter 
                  régulièrement ces conditions.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Droit applicable */}
          <Card>
            <CardHeader>
              <CardTitle>Droit applicable et juridiction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Ces conditions d'utilisation sont régies par le droit beninois. Tout litige relatif à 
                l'utilisation de cette plateforme sera soumis à la juridiction exclusive des tribunaux 
                compétents de Cotonou, Bénin.
              </p>
              <p className="text-gray-600">
                En cas de conflit entre les versions française et anglaise de ces conditions, la version 
                française prévaudra.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-6 h-6 mr-2 text-orange-500" />
                Nous contacter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Si vous avez des questions concernant ces conditions d'utilisation, vous pouvez nous contacter :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email :</strong> legal@eglise-celeste.org</p>
                <p><strong>Téléphone :</strong> +229 01 00 00 00 00</p>
                <p><strong>Adresse :</strong> Benin cotonou </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}