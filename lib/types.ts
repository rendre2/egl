// types.ts
export interface Testimonial {
  id: string
  name: string
  location: string
  content: string
  rating: number
  avatar: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success'
  date: string
}

export interface HomepageData {
  id: string
  heroTitle: string
  heroSubtitle: string
  heroImage?: string
  featuredModules: string[]
  testimonials: Testimonial[]
  announcements: Announcement[]
  testimonialsTitle?: string
  testimonialsSubtitle?: string
  ctaTitle?: string
  ctaSubtitle?: string
}

export interface Stats {
  totalUsers: number
  totalModules: number
  successRate: number
}

// Nouvelles interfaces pour la structure hiérarchique

export interface Content {
  id: string
  title: string
  description?: string
  type: 'VIDEO' | 'AUDIO'
  url: string
  duration: number
  order: number
  isActive: boolean
  isCompleted?: boolean
  isUnlocked?: boolean
  progress?: number
  watchTime?: number
}

export interface Quiz {
  id: string
  title: string
  passingScore: number
  questions: Question[]
  isPassed?: boolean
  userResult?: QuizResult
}

export interface Question {
  id: string
  question: string
  type: 'multiple_choice' | 'true_false'
  options?: string[]
  correctAnswer: number | boolean
  explanation?: string
}

export interface QuizResult {
  id: string
  score: number
  passed: boolean
  answers: any
  createdAt: string
}

export interface Chapter {
  id: string
  title: string
  description: string
  order: number
  isActive: boolean
  contents: Content[]
  quiz?: Quiz
  isCompleted?: boolean
  isUnlocked?: boolean
  allContentsCompleted?: boolean
  quizPassed?: boolean
}

export interface Module {
  id: string
  title: string
  description: string
  thumbnail?: string
  order: number
  isActive: boolean
  chapters: Chapter[]
  isCompleted?: boolean
  isUnlocked?: boolean
  progress?: number
  allChaptersCompleted?: boolean
}

export interface UserStats {
  totalModules: number
  completedModules: number
  totalChapters: number
  completedChapters: number
  totalContents: number
  completedContents: number
  totalWatchTime: number
  averageScore: number
  certificates: number
  lastActivity: string | null
}

export interface UserProfile {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  pays: string
  ville: string
  adresse?: string
  paroisse?: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  emailVerified: string | null
}

export interface Certificate {
  id: string
  type: 'BRONZE' | 'SILVER' | 'GOLD'
  certificateNumber: string
  issuedAt: string
  module: {
    title: string
    order: number
  }
}

export interface EligibleCertificate {
  type: 'BRONZE' | 'SILVER' | 'GOLD'
  requiredModules: number
}

export interface Notification {
  id: string
  title: string
  content: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ANNOUNCEMENT'
  isRead: boolean
  createdAt: string
  userId?: string
}

export interface DailyVerse {
  id: string
  verse: string
  reference: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface RecentActivity {
  id: string
  type: 'completion' | 'quiz_passed' | 'registration' | 'email_verified' | 'module_completed' | 'chapter_completed' | 'content_completed'
  user: string
  module?: string
  chapter?: string
  content?: string
  date: string
  score?: number
}

export interface AdminStats {
  totalUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  activeUsers: number
  totalModules: number
  activeModules: number
  totalChapters: number
  totalContents: number
  totalQuizzes: number
  completedModules: number
  completedChapters: number
  completedContents: number
  averageScore: number
  registrationsThisMonth: number
  completionsThisMonth: number
  recentActivity: RecentActivity[]
}

// Types pour les formulaires d'administration
export interface ModuleFormData {
  title: string
  description: string
  thumbnail?: string
  isActive: boolean
}

export interface ChapterFormData {
  moduleId: string
  title: string
  description: string
  isActive: boolean
}

export interface ContentFormData {
  chapterId: string
  title: string
  description?: string
  type: 'VIDEO' | 'AUDIO'
  url: string
  duration: number
  isActive: boolean
}

export interface QuizFormData {
  chapterId: string
  title: string
  questions: Question[]
  passingScore: number
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ModulesApiResponse extends ApiResponse {
  modules: Module[]
  userStats?: UserStats
}

export interface ProfileApiResponse extends ApiResponse {
  profile: UserProfile
  stats: UserStats
  recentActivity: RecentActivity[]
}