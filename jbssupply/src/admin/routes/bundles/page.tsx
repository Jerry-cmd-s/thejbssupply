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
 * SAME logic as frontend
 * Determines next delivery date from today
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
    header: "Delivery Date",
    cell: ({ getValue }) =>
      new Date(getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor("customer_name", {
    header: "Customer",
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("bundle_name", {
    header: "Bundle",
  }),
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
  const limit = 20

  const todayISO = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] =
    useState<string>(todayISO)

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

      if (!res.ok) {
        throw new Error("Failed to load bundles")
      }

      return res.json() as Promise<{
        bundles: AdminBundleRow[]
      }>
    },
  })

  /* =======================
     Transform + Filter
  ===================== */

  const rows = useMemo(() => {
    if (!data?.bundles) return []

    return data.bundles
      .map((bundle) => {
        const nextDelivery = getNextDeliveryDate(
          bundle.delivery_schedule
        )

        if (!nextDelivery) return null

        return {
          ...bundle,
          next_delivery_date: nextDelivery,
        }
      })
      .filter(
        (b): b is AdminBundleRow & { next_delivery_date: string } =>
          Boolean(b) && b.next_delivery_date === selectedDate
      )
  }, [data, selectedDate])

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

  /* =======================
     UI
  ===================== */

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Heading level="h1">
            Deliveries for{" "}
            {new Date(selectedDate).toLocaleDateString()}
          </Heading>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setPagination((p) => ({
                ...p,
                pageIndex: 0,
              }))
            }}
            className="rounded-md border px-3 py-1 text-sm"
          />
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
