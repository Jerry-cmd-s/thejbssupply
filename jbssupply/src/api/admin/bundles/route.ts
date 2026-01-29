import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function getNextDeliveryDate(schedule: any): string | null {
  if (!schedule?.day_of_month || !schedule?.interval_count) {
    return null
  }

  const today = new Date()
  const targetDay = Math.min(schedule.day_of_month, 28)

  let next = new Date(
    today.getFullYear(),
    today.getMonth(),
    targetDay
  )

  if (next < today) {
    next.setMonth(next.getMonth() + schedule.interval_count)
    next.setDate(targetDay)
  }

  return isNaN(next.getTime())
    ? null
    : next.toISOString().split("T")[0]
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: [
      "id",
      "first_name",
      "last_name",
      "email",
      "metadata",
    ],
  })

  const bundles = customers.flatMap((customer) => {
    const customerBundles =
      (customer.metadata?.bundles as any[]) || []

    return customerBundles.map((bundle) => ({
      bundle_id: bundle.id,
      bundle_name: bundle.name,
      customer_id: customer.id,
      customer_name: `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
      email: customer.email,
      items: bundle.items ?? [],
      delivery_schedule: bundle.delivery_schedule ?? null,
      next_delivery: getNextDeliveryDate(
        bundle.delivery_schedule
      ),
      created_at: bundle.created_at,
    }))
  })

  res.json({ bundles })
}
