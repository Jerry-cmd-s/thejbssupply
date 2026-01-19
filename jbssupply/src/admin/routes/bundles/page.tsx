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
 * Calculate next delivery date based on:
 * - interval_count in months
 * - day_of_month
 * - start_date
 */
function getNextDeliveryDate(
  schedule: DeliverySchedule
): string | null {
  if (!schedule) return null

  const { interval_count, day_of_month, start_date } = schedule
  const today = new Date()
  let current = new Date(start_date)

  if (isNaN(current.getTime())) return null
  current.setDate(Math.min(day_of_month, 28))

  while (current < today) {
    current.setMonth(current.getMonth() + interval_count)
  }

  return isNaN(current.getTime())
    ? null
    : current.toISOString().slice(0, 10)
}

/* =======================
   Table Columns
======================= */

const columnHelper =
  createDataTableColumnHelper<AdminBundleRow & { next_delivery_date: string }>()

const columns = [
  columnHelper.accessor("next_delivery_date", {
    header: "Next Delivery",
    cell: ({ getValue }) =>
      new Date(getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor("customer_name", { header: "Customer" }),
  columnHelper.accessor("email", { header: "Email" }),
  columnHelper.accessor("bundle_name", { header: "Bundle" }),
  columnHelper.accessor("items", {
    header: "Products",
    cell: ({ getValue }) => (
      <ul className="space-y-1">
        {getValue().map((item, idx) => (
          <li key={idx} className="text-sm">
            {item.quantity} × {item.product_title}
          </li>
        ))}
      </ul>
    ),
  }),
]

/* =======================
   Page Component
======================= */

const AdminBundlesPage = () => {
  const limit = 50

  const [pagination, setPagination] =
    useState<DataTablePaginationState>({
      pageIndex: 0,
      pageSize: limit,
    })

  const offset = pagination.pageIndex * limit

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const res = await fetch("/admin/bundles", {
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to load bundles")
      return res.json() as Promise<{ bundles: AdminBundleRow[] }>
    },
  })

  /* =======================
     Transform bundles with next delivery
  ======================== */

  const rows = useMemo(() => {
    if (!data?.bundles) return []

    return data.bundles.map((bundle) => ({
      ...bundle,
      next_delivery_date: getNextDeliveryDate(bundle.delivery_schedule) || "",
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
