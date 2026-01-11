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

  // Fetch customers with specific fields
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "metadata", "created_at"],
  })

  // Format the response
  const formatted = customers.map((customer) => ({
    id: customer.id,
    email: customer.email,
    metadata: customer.metadata ?? {},
    created_at: customer.created_at,
  }))

  res.json({
    customers: formatted,
  })
}