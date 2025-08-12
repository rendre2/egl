'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, Lock, Users, Database, Mail } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Header />
      <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Politique de Confidentialité</h1>
          <p className="text-xl text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-6 h-6 mr-2 text-orange-500" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                L'Église Céleste s'engage à protéger la confidentialité et la sécurité des informations 
                personnelles de ses utilisateurs. Cette politique de confidentialité explique comment nous 
                collectons, utilisons, stockons et protégeons vos données personnelles lorsque vous utilisez 
                notre plateforme de formation spirituelle.
              </p>
              <p>
                En utilisant notre plateforme, vous acceptez les pratiques décrites dans cette politique. 
                Si vous n'acceptez pas ces pratiques, veuillez ne pas utiliser nos services.
              </p>
            </CardContent>
          </Card>

          {/* Informations collectées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-6 h-6 mr-2 text-orange-500" />
                Informations que nous collectons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Informations personnelles</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone</li>
                  <li>Pays et ville de résidence</li>
                  <li>Adresse postale (optionnel)</li>
                  <li>Paroisse de provenance (optionnel)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Données d'utilisation</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Progression dans les modules de formation</li>
                  <li>Temps de visionnage des vidéos</li>
                  <li>Résultats des questionnaires (QCM)</li>
                  <li>Dates et heures de connexion</li>
                  <li>Adresse IP et informations du navigateur</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Cookies et technologies similaires</h3>
                <p className="text-gray-600">
                  Nous utilisons des cookies pour améliorer votre expérience utilisateur, maintenir votre 
                  session de connexion et analyser l'utilisation de notre plateforme.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Utilisation des données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 mr-2 text-orange-500" />
                Comment nous utilisons vos informations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Fourniture des services</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Créer et gérer votre compte utilisateur</li>
                    <li>Fournir l'accès aux modules de formation</li>
                    <li>Suivre votre progression et vos résultats</li>
                    <li>Personnaliser votre expérience d'apprentissage</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Communication</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Envoyer des notifications importantes sur votre compte</li>
                    <li>Répondre à vos questions et demandes de support</li>
                    <li>Informer des nouveaux modules ou fonctionnalités</li>
                    <li>Envoyer des rappels de formation (avec votre consentement)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Amélioration des services</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Analyser l'utilisation de la plateforme</li>
                    <li>Identifier et corriger les problèmes techniques</li>
                    <li>Développer de nouvelles fonctionnalités</li>
                    <li>Améliorer la qualité du contenu de formation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partage des données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-6 h-6 mr-2 text-orange-500" />
                Partage de vos informations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Nous ne vendons, ne louons ni ne partageons vos informations personnelles avec des tiers, 
                sauf dans les cas suivants :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>Avec votre consentement explicite</strong> : Lorsque vous nous autorisez 
                  expressément à partager vos informations
                </li>
                <li>
                  <strong>Prestataires de services</strong> : Avec des partenaires de confiance qui nous 
                  aident à fournir nos services (hébergement, support technique)
                </li>
                <li>
                  <strong>Obligations légales</strong> : Lorsque la loi nous oblige à divulguer certaines 
                  informations aux autorités compétentes
                </li>
                <li>
                  <strong>Protection des droits</strong> : Pour protéger nos droits, notre propriété ou 
                  la sécurité de nos utilisateurs
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-6 h-6 mr-2 text-orange-500" />
                Sécurité de vos données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Nous mettons en place des mesures de sécurité appropriées pour protéger vos informations 
                personnelles contre l'accès non autorisé, la modification, la divulgation ou la destruction :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Chiffrement des données sensibles (SSL/TLS)</li>
                <li>Authentification sécurisée avec hachage des mots de passe</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Surveillance et journalisation des accès</li>
                <li>Sauvegardes régulières et sécurisées</li>
                <li>Mise à jour régulière des systèmes de sécurité</li>
              </ul>
            </CardContent>
          </Card>

          {/* Vos droits */}
          <Card>
            <CardHeader>
              <CardTitle>Vos droits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Vous disposez des droits suivants concernant vos données personnelles :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Droit d'accès</h4>
                  <p className="text-sm text-gray-600">
                    Vous pouvez demander une copie de toutes les données personnelles que nous détenons sur vous.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Droit de rectification</h4>
                  <p className="text-sm text-gray-600">
                    Vous pouvez demander la correction de données inexactes ou incomplètes.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Droit à l'effacement</h4>
                  <p className="text-sm text-gray-600">
                    Vous pouvez demander la suppression de vos données personnelles dans certaines conditions.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Droit à la portabilité</h4>
                  <p className="text-sm text-gray-600">
                    Vous pouvez demander le transfert de vos données vers un autre service.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conservation des données */}
          <Card>
            <CardHeader>
              <CardTitle>Conservation des données</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Nous conservons vos données personnelles aussi longtemps que nécessaire pour :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Fournir nos services de formation</li>
                <li>Respecter nos obligations légales</li>
                <li>Résoudre les litiges éventuels</li>
                <li>Faire valoir nos droits légaux</li>
              </ul>
              <p className="text-gray-600 mt-4">
                En général, nous conservons vos données de compte pendant 3 ans après votre dernière 
                activité, sauf si vous demandez leur suppression plus tôt.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Nous contacter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Si vous avez des questions concernant cette politique de confidentialité ou si vous 
                souhaitez exercer vos droits, vous pouvez nous contacter :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email :</strong> privacy@eglise-celeste.org</p>
                <p><strong>Téléphone :</strong> +229 001 00 00 00 00</p>
                <p><strong>Adresse :</strong> Benin cotonou rue 0000</p>
              </div>
            </CardContent>
          </Card>

          {/* Modifications */}
          <Card>
            <CardHeader>
              <CardTitle>Modifications de cette politique</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                Les modifications importantes vous seront notifiées par email ou via un avis sur notre 
                plateforme. Nous vous encourageons à consulter régulièrement cette page pour rester 
                informé de nos pratiques de confidentialité.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}