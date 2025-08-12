import nodemailer from 'nodemailer'

// Configuration du transporteur email
function createTransporter() {
  // Vérifier si les variables d'environnement sont définies
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.warn('Variables d\'environnement email non configurées, utilisation du mode simulation')
    return null
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: true, 
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    }
  })
}

export async function sendVerificationEmail(email: string, name: string, verificationToken: string) {
  const transporter = createTransporter()
  
  if (!transporter) {
    console.log(`[SIMULATION] Email de vérification pour ${email}`)
    console.log(`Token: ${verificationToken}`)
    console.log(`URL: ${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`)
    return
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`

  const mailOptions = {
    from: `"Église Céleste" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Vérifiez votre adresse email - Église Céleste',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérification Email - Église Céleste</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #f97316 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Église Céleste</h1>
          <p style="color: #fbbf24; margin: 10px 0 0 0; font-size: 16px;">Formation Spirituelle</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e40af; margin-top: 0;">Bienvenue ${name} !</h2>
          
          <p>Merci de vous être inscrit sur notre plateforme de formation spirituelle. Pour commencer votre parcours de foi, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Vérifier mon Email
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="background: #e2e8f0; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
            ${verificationUrl}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Ce lien expirera dans 24 heures pour des raisons de sécurité.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
          <p>© 2025 Église Céleste. Tous droits réservés.</p>
          <p>Cotonou, Bénin - rue 00000</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Bienvenue ${name} !
      
      Merci de vous être inscrit sur notre plateforme de formation spirituelle de l'Église Céleste.
      
      Pour commencer votre parcours de foi, veuillez vérifier votre adresse email en visitant ce lien :
      ${verificationUrl}
      
      Ce lien expirera dans 24 heures pour des raisons de sécurité.
      
      Bénédictions,
      L'équipe de l'Église Céleste
    `
  }

  await transporter.sendMail(mailOptions)
}

export async function sendWelcomeEmail(email: string, name: string) {
  const transporter = createTransporter()
  
  if (!transporter) {
    console.log(`[SIMULATION] Email de bienvenue pour ${email}`)
    return
  }

  const loginUrl = `${process.env.NEXTAUTH_URL}/auth/signin`
  const modulesUrl = `${process.env.NEXTAUTH_URL}/modules`

  const mailOptions = {
    from: `"Église Céleste" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Bienvenue dans votre parcours spirituel ! - Église Céleste',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue - Église Céleste</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #f97316 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Félicitations ${name} !</h1>
          <p style="color: #fbbf24; margin: 10px 0 0 0; font-size: 16px;">Votre email a été vérifié avec succès</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e40af; margin-top: 0;">Bienvenue dans la famille spirituelle !</h2>
          
          <p>Votre compte est maintenant activé et vous pouvez commencer votre parcours de formation spirituelle. Nous sommes ravis de vous accompagner dans cette belle aventure de foi.</p>
          
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">🚀 Prochaines étapes :</h3>
            <ul style="color: #1e40af; padding-left: 20px;">
              <li>Connectez-vous à votre compte</li>
              <li>Explorez nos modules de formation</li>
              <li>Commencez par le Module 1 : Fondements de la Foi</li>
              <li>Participez aux QCM pour valider vos acquis</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${modulesUrl}" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">
              Commencer ma Formation
            </a>
            <a href="${loginUrl}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Se Connecter
            </a>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              💡 <strong>Conseil :</strong> Nous recommandons de suivre les modules dans l'ordre pour une progression optimale. Chaque module se débloque après validation du précédent.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Si vous avez des questions, n'hésitez pas à nous contacter via notre page de support ou par email à <a href="mailto:support@eglise-celeste.org" style="color: #f97316;">support@eglise-celeste.org</a>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
          <p>Que Dieu vous bénisse dans ce parcours ! 🙏</p>
          <p>© 2025 Église Céleste. Tous droits réservés.</p>
          <p>Cotonou, Bénin - rue 00000</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Félicitations ${name} !
      
      Votre email a été vérifié avec succès et votre compte est maintenant activé.
      
      Bienvenue dans notre communauté spirituelle ! Nous sommes ravis de vous accompagner dans votre parcours de formation.
      
      Prochaines étapes :
      - Connectez-vous à votre compte : ${loginUrl}
      - Explorez nos modules de formation : ${modulesUrl}
      - Commencez par le Module 1 : Fondements de la Foi
      - Participez aux QCM pour valider vos acquis
      
      Si vous avez des questions, contactez-nous à support@eglise-celeste.org
      
      Que Dieu vous bénisse dans ce parcours !
      L'équipe de l'Église Céleste
    `
  }

  await transporter.sendMail(mailOptions)
}

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const transporter = createTransporter()
  
  if (!transporter) {
    console.log(`[SIMULATION] Email de réinitialisation pour ${email}`)
    console.log(`Token: ${resetToken}`)
    console.log(`URL: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`)
    return
  }

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

  const mailOptions = {
    from: `"Église Céleste" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe - Église Céleste',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation Mot de Passe - Église Céleste</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #f97316 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Église Céleste</h1>
          <p style="color: #fbbf24; margin: 10px 0 0 0; font-size: 16px;">Réinitialisation de mot de passe</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e40af; margin-top: 0;">Bonjour ${name},</h2>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Réinitialiser mon Mot de Passe
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="background: #e2e8f0; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
            ${resetUrl}
          </p>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0; color: #dc2626; font-size: 14px;">
              <strong>Important :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Ce lien expirera dans 1 heure pour des raisons de sécurité.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
          <p>© 2025 Église Céleste. Tous droits réservés.</p>
          <p>Cotonou, Bénin - rue 00000</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Bonjour ${name},
      
      Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Église Céleste.
      
      Pour créer un nouveau mot de passe, visitez ce lien :
      ${resetUrl}
      
      Ce lien expirera dans 1 heure pour des raisons de sécurité.
      
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
      
      L'équipe de l'Église Céleste
    `
  }

  await transporter.sendMail(mailOptions)
}