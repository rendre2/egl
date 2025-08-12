'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Facebook, Youtube, Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-blue-900 dark:bg-blue-950 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <Image
                src="/logo-parcours.png" 
                alt="Logo Église Céleste"
                width={48} 
                height={48} 
                className="object-contain"
              />
             
            </div>
            <p className="text-blue-200 mb-6 leading-relaxed">
              Notre mission est de former et d'équiper les fidèles à travers des enseignements 
              spirituels et doctrinaux de qualité, accessible à tous, partout dans le monde.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-blue-800 dark:bg-blue-900 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-blue-800 dark:bg-blue-900 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-blue-800 dark:bg-blue-900 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xl font-semibold mb-6">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-blue-200 hover:text-orange-300 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/modules" className="text-blue-200 hover:text-orange-300 transition-colors">
                  Modules de Formation
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="text-blue-200 hover:text-orange-300 transition-colors">
                  Connexion
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="text-blue-200 hover:text-orange-300 transition-colors">
                  Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xl font-semibold mb-6">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-400" />
                <span className="text-blue-200">formation@eglise-celeste.org</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-400" />
                <span className="text-blue-200">+229 01 00 00 00 00</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-orange-400 mt-1" />
                <span className="text-blue-200">
                  Cotonou, Benin<br />
                  rue 0000000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-blue-300 text-sm">
            © 2025 Église Céleste. Tous droits réservés.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-blue-300 hover:text-orange-300 text-sm transition-colors">
              Politique de Confidentialité
            </Link>
            <Link href="/terms" className="text-blue-300 hover:text-orange-300 text-sm transition-colors">
              Conditions d'Utilisation
            </Link>
            <Link href="/support" className="text-blue-300 hover:text-orange-300 text-sm transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}