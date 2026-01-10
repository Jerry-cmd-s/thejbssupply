import {
  SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"

export default async function resetPasswordTokenHandler({
  event: { data: { entity_id: email, token, actor_type } },
  container,
}: SubscriberArgs<{ entity_id: string, token: string, actor_type: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const config = container.resolve("configModule")

  let urlPrefix = ""

  if (actor_type === "customer") {
    // Frontend URL for the customer
    urlPrefix = config.admin.storefrontUrl || "https://thejbssupply.com"
  } else {
    // Admin URL (if needed)
    const backendUrl = config.admin.backendUrl !== "/" ? config.admin.backendUrl :
      "https://jbssupply.medusajs.app"
    const adminPath = config.admin.path
    urlPrefix = `${backendUrl}${adminPath}`
  }

  // Send the notification with the correct reset URL
  await notificationModuleService.createNotifications({
    to: email,
    channel: "email",
    template: "password-reset",
    data: {
      reset_url: `${urlPrefix}/reset-password?token=${token}&email=${email}`,
    },
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
