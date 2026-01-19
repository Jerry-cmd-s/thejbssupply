"use client"
import {
  Container,
  DataTable,
  Heading,
  createDataTableColumnHelper,
  useDataTable,
  DataTablePaginationState,
} from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
/* =======================
   Types
======================= */
type BundleItem = {
  product_title: string
  quantity: number
}
type DeliverySchedule = {
  interval_type: "months"
  interval_count: number
  day_of_month: number
  start_date: string
}
type AdminBundleRow = {
  bundle_id: string
  bundle_name: string
  customer_name: string
  email: string
  items: BundleItem[]
  delivery_schedule: DeliverySchedule
}
/* =======================
   Helpers
======================= */
/**
 * Calculate the next delivery date based on:
 * - day_of_month
 * - interval_count (in months)
 * - Anchored to start_date
 */
const getNextDeliveryDate = (schedule: DeliverySchedule): Date | null => {
  if (!schedule) return null
  const { day_of_month, interval_count, start_date } = schedule
  const today = new Date()
  let current = new Date(start_date)
  if (isNaN(current.getTime())) return null

  // Set initial delivery to day_of_month in start month, clamped to last day of month
  let lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
  current.setDate(Math.min(day_of_month, lastDay))

  // Advance by interval_count months until we find a date in the future (or today)
  while (current < today) {
    current.setMonth(current.getMonth() + interval_count)
    lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
    current.setDate(Math.min(day_of_month, lastDay))
  }

  return current
}
/* =======================
   Table Columns
======================= */
const columnHelper =
  createDataTableColumnHelper<AdminBundleRow & { next_delivery: string }>()
const columns = [
  columnHelper.accessor("next_delivery", {
    header: "Next Delivery",
    cell: ({ getValue }) => getValue() || "N/A",
  }),
  columnHelper.accessor("customer_name", { header: "Customer" }),
  columnHelper.accessor("email", { header: "Email" }),
  columnHelper.accessor("bundle_name", { header: "Bundle" }),
  columnHelper.accessor("items", {
    header: "Products",
    cell: ({ getValue }) =>
      Array.isArray(getValue()) && getValue().length > 0 ? (
        <ul className="space-y-1">
          {getValue().map((item, idx) => (
            <li key={idx} className="text-sm">
              {item.quantity} × {item.product_title}
            </li>
          ))}
        </ul>
      ) : (
        "No products"
      ),
  }),
]
/* =======================
   Admin Page Component
======================= */
const AdminBundlesPage = () => {
  const limit = 50
  const [pagination, setPagination] =
    useState<DataTablePaginationState>({
      pageIndex: 0,
      pageSize: limit,
    })
  // Fetch all bundles from your backend
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const res = await fetch("/admin/bundles", {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch bundles")
      return res.json() as Promise<{ bundles: AdminBundleRow[] }>
    },
  })
  if (error) console.error(error)
  // Add next_delivery string to each row
  const rows = useMemo(() => {
    if (!data?.bundles) return []
    return data.bundles.map((b) => ({
      ...b,
      next_delivery: b.delivery_schedule
        ? getNextDeliveryDate(b.delivery_schedule)?.toLocaleDateString() ?? "N/A"
        : "N/A",
    }))
  }, [data])
  const table = useDataTable({
    columns,
    data: rows,
    rowCount: rows.length,
    isLoading,
    getRowId: (row) => row.bundle_id,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })
  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">All Bundle Deliveries</Heading>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}
/* =======================
   Admin Navigation
======================= */
export const config = defineRouteConfig({
  label: "Bundle Deliveries",
})
export default AdminBundlesPage