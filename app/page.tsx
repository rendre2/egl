'use client'

import { useSession } from 'next-auth/react'
import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { ServicesSection } from '@/components/ui/services-section'
import { FeaturedModules } from '@/components/featured-modules'
import { AnnouncementsSection } from '@/components/announcements'
import { TestimonialsSection } from '@/components/testimonials'
import { DailyVerse } from '@/components/daily-verse'
import { Footer } from '@/components/footer'

export default function HomePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main>
        <HeroSection />
        <ServicesSection />
        <section className="py-8 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <DailyVerse />
          </div>
        </section>
        <AnnouncementsSection />
        <FeaturedModules />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}