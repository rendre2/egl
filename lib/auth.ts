import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Fonction utilitaire pour obtenir l'URL de base
function getBaseUrl() {
  // En production Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Si NEXTAUTH_URL est définie
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // Fallback pour développement local
  return 'http://localhost:3000'
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role: 'USER',
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Identifiants manquants')
          }

          // Validation basique de l'email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(credentials.email)) {
            throw new Error('Format d\'email invalide')
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase().trim()
            }
          })

          if (!user) {
            throw new Error('Utilisateur non trouvé')
          }

          if (!user.password) {
            throw new Error('Connexion par mot de passe non disponible')
          }

          // Vérifier si l'email est vérifié
          if (!user.emailVerified) {
            throw new Error('email_not_verified')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Mot de passe incorrect')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email,
            role: user.role
          }
        } catch (error) {
          console.error('Erreur d\'authentification:', error)
          // Renvoyer l'erreur pour qu'elle soit gérée côté client
          throw error
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    updateAge: 24 * 60 * 60, // 24 heures
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Lors de la première connexion
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            role: true,
            prenom: true,
            nom: true,
            emailVerified: true
          }
        })
        
        if (dbUser) {
          token.role = dbUser.role
          token.id = dbUser.id
          token.emailVerified = dbUser.emailVerified
          token.name = dbUser.prenom && dbUser.nom ? `${dbUser.prenom} ${dbUser.nom}` : user.email
        }
      }

      // Pour les connexions Google, s'assurer que l'utilisateur existe en base
      if (account?.provider === 'google' && user) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Créer l'utilisateur s'il n'existe pas
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                prenom: user.name?.split(' ')[0] || '',
                nom: user.name?.split(' ').slice(1).join(' ') || '',
                emailVerified: new Date(),
                role: 'USER',
                image: user.image,
                telephone: '',
                password: null,
                adresse: '',
                ville: '',
                pays: '',
              }
            })
            token.role = newUser.role
            token.id = newUser.id
          }
        } catch (error) {
          console.error('Erreur lors de la création de l\'utilisateur Google:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        
        // Mettre à jour le nom si nécessaire
        if (token.name) {
          session.user.name = token.name as string
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('NextAuth redirect - url:', url, 'baseUrl:', baseUrl)
      
      // Utiliser l'URL de base dynamique pour Vercel
      const dynamicBaseUrl = getBaseUrl()
      
      // Si l'URL commence par /, c'est une redirection relative
      if (url.startsWith("/")) {
        return `${dynamicBaseUrl}${url}`
      }
      
      // Si l'URL est sur le même domaine que notre base URL
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(dynamicBaseUrl)
        
        if (urlObj.origin === baseUrlObj.origin) {
          return url
        }
      } catch (error) {
        console.error('Erreur lors du parsing URL:', error)
      }
      
      // Sinon, rediriger vers la page d'accueil
      return `${dynamicBaseUrl}/modules`
    },
    async signIn({ user, account, profile }) {
      console.log('NextAuth signIn callback:', { 
        provider: account?.provider, 
        email: user?.email 
      })
      
      // Pour Google OAuth
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          // Si l'utilisateur existe déjà avec un autre provider, permettre la connexion
          if (existingUser) {
            console.log('Utilisateur Google existant trouvé:', existingUser.email)
            return true
          }

          // Sinon, l'utilisateur sera créé automatiquement par l'adapter
          console.log('Nouvel utilisateur Google à créer:', user.email)
          return true
        } catch (error) {
          console.error('Erreur lors de la vérification Google Sign-In:', error)
          return false
        }
      }

      // Pour les credentials, la vérification est déjà faite dans authorize()
      return true
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`Connexion réussie pour ${user.email} via ${account?.provider}`)
      
      if (isNewUser) {
        console.log(`Nouvel utilisateur créé: ${user.email}`)
      }
    },
    async signOut({ session, token }) {
      console.log(`Déconnexion de ${session?.user?.email || token?.email}`)
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  
  // Configuration pour Vercel
  useSecureCookies: process.env.NODE_ENV === "production",
  
  // Configuration des cookies optimisée pour Vercel
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-next-auth.session-token" 
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  
  // Debug uniquement en développement
  debug: process.env.NODE_ENV === 'development',
  
  // Logger pour production
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata)
      }
    }
  },
  
  secret: process.env.NEXTAUTH_SECRET,
}