'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Book, Calendar } from 'lucide-react'

interface DailyVerse {
  verse: string
  reference: string
  date: string
}

export function DailyVerse() {
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDailyVerse = async () => {
      try {
        const response = await fetch('/api/daily-verse')
        if (response.ok) {
          const data = await response.json()
          setDailyVerse(data)
        }
      } catch (error) {
        console.error('Erreur lors du chargement du verset du jour:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDailyVerse()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse">
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-white/20 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dailyVerse) return null

  return (
    <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Book className="w-6 h-6" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium opacity-90">
                Verset du jour
              </span>
            </div>
            <blockquote className="text-lg font-medium leading-relaxed mb-3 italic">
              "{dailyVerse.verse}"
            </blockquote>
            <cite className="text-sm font-semibold opacity-90">
              - {dailyVerse.reference}
            </cite>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}