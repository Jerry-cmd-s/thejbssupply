import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Resolve Query from the Medusa container
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const deliveryDay = req.query.delivery_day
    ? Number(req.query.delivery_day)
    : null

  // Use query.graph to retrieve customers and their metadata
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name", "email", "metadata"],
  })

  const bundles = customers.flatMap((customer) => {
    // Access custom data stored in metadata
    const customerBundles = (customer.metadata?.bundles as any[]) || []

    return customerBundles
      .filter((bundle) =>
        deliveryDay ? bundle.delivery_day === deliveryDay : true
      )
      .map((bundle) => ({
        customer_id: customer.id,
        customer_name: `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
        email: customer.email,
        bundle_id: bundle.id,
        bundle_name: bundle.name,
        delivery_day: bundle.delivery_day,
        created_at: bundle.created_at,
      }))
  })

  res.json({ bundles })
}