import { INotificationModuleService, IUserModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { EmailTemplates } from '../modules/email-notifications/templates'

const BACKEND_URL = 'https://jbssupply.medusajs.app'  // Hardcoded since no constants file; use env var if preferred (e.g., process.env.BACKEND_URL)

export default async function userInviteHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION
  )
  const userModuleService: IUserModuleService = container.resolve(Modules.USER)
  
  try {
    const invite = await userModuleService.retrieveInvite(data.id)
    
    await notificationModuleService.createNotifications({
      to: invite.email,
      channel: 'email',
      template: EmailTemplates.INVITE_USER,
      data: {
        emailOptions: {
          replyTo: 'info@example.com',
          subject: "You've been invited to Medusa!"
        },
        inviteLink: `${BACKEND_URL}/app/invite?token=${invite.token}`,
        preview: 'The administration dashboard awaits...'
      }
    })
  } catch (error) {
    console.error('Error handling invite event:', error)
    // Optionally, add retry logic or alert here if needed
  }
}

export const config: SubscriberConfig = {
  event: ['invite.created', 'invite.resent']
}