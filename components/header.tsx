'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsPanel } from '@/components/notifications-panel'
import { Menu, X, User, LogOut, BookOpen, Home } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white dark:bg-gray-900 shadow-lg border-b-4 border-orange-500 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo-parcours.png"
              alt="Logo Église Céleste"
              width={48} 
              height={48} 
              className="object-contain"
              priority 
            />
           
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </Link>
            <Link
              href="/modules"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Modules</span>
            </Link>
            {session?.user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Administration</span>
              </Link>
            )}
            {session && (
              <Link
                href="/profile"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Profil</span>
              </Link>
            )}
            <Link
              href="/support"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 transition-colors"
            >
              <span>Support</span>
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {session && <NotificationsPanel />}
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 dark:text-gray-300">
                  Bonjour, {session.user.name || session.user.email}
                </span>
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/signin">
                  <Button variant="outline">Connexion</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Inscription
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Menu Mobile */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-4 pt-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>Accueil</span>
              </Link>
              <Link
                href="/modules"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="w-4 h-4" />
                <span>Modules</span>
              </Link>
              {session?.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Administration</span>
                </Link>
              )}
              {session && (
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Profil</span>
                </Link>
              )}
              <Link
                href="/support"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Support</span>
              </Link>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Thème</span>
                  <ThemeToggle />
                </div>
                {session && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Notifications</span>
                    <NotificationsPanel />
                  </div>
                )}
              </div>
              {session ? (
                <Button
                  onClick={() => {
                    signOut()
                    setIsMenuOpen(false)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-fit"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Inscription
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}