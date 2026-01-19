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

function getNextDeliveryDate(schedule: DeliverySchedule): string {
  if (!schedule) return "N/A"

  const { interval_count, day_of_month, start_date } = schedule
  const today = new Date()
  const start = new Date(start_date)

  if (isNaN(start.getTime())) return "Invalid date"

  let current = new Date(start)
  current.setDate(Math.min(day_of_month, 28))

  while (current < today) {
    current.setMonth(current.getMonth() + interval_count)
  }

  return isNaN(current.getTime())
    ? "Invalid date"
    : current.toLocaleDateString()
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

  if (error) {
    console.error(error)
  }

  const rows = useMemo(() => {
    if (!data?.bundles) return []

    return data.bundles.map((b) => ({
      ...b,
      next_delivery: getNextDeliveryDate(b.delivery_schedule),
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
