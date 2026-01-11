import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const customerService = req.scope.resolve("customer")

  const customers = await customerService.list(
    {},
    {
      relations: [],
    }
  )

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
