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
  delivery_schedule: DeliverySchedule
  next_delivery: string
}

/* =======================
   Helpers
======================= */

const getNextDeliveryDate = (schedule: DeliverySchedule): string => {
  if (!schedule) return "N/A"

  const { interval_count, day_of_month, start_date } = schedule

  const start = new Date(start_date)
  if (isNaN(start.getTime())) return "N/A"

  const today = new Date()
  let next = new Date(start)

  // Ensure the day is valid (1–28)
  next.setDate(Math.min(day_of_month, 28))

  while (next < today) {
    next.setMonth(next.getMonth() + interval_count)
    if (next.getDate() !== Math.min(day_of_month, 28)) {
      next.setDate(Math.min(day_of_month, 28))
    }
  }

  return next.toLocaleDateString()
}

/* =======================
   Table Columns
======================= */

const columnHelper = createDataTableColumnHelper<AdminBundleRow>()

const columns = [
  columnHelper.accessor("next_delivery", {
    header: "Next Delivery",
  }),
  columnHelper.accessor("customer_name", { header: "Customer" }),
  columnHelper.accessor("email", { header: "Email" }),
  columnHelper.accessor("bundle_name", { header: "Bundle" }),
]

/* =======================
   Admin Page Component
======================= */

const AdminBundlesPage = () => {
  const limit = 50
  const [pagination, setPagination] = useState<DataTablePaginationState>({
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
      const json = await res.json()

      // Calculate next delivery for each bundle
      const bundles: AdminBundleRow[] = []
      json.bundles.forEach((b: any) => {
        const next_delivery = getNextDeliveryDate(b.delivery_schedule)
        bundles.push({
          ...b,
          next_delivery,
        })
      })

      return bundles
    },
  })

  if (error) {
    console.error(error)
  }

  const rows = useMemo(() => data ?? [], [data])

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
