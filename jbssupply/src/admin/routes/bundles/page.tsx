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

type AdminBundleRow = {
  bundle_id: string
  bundle_name: string
  customer_id: string
  customer_name: string
  email: string
  delivery_date: string
  created_at: string
}

type BundlesResponse = {
  bundles: AdminBundleRow[]
  count: number
}

/* =======================
   Helpers
======================= */

const formatDate = (date: Date) =>
  date.toISOString().split("T")[0]

/* =======================
   Table Columns
======================= */

const columnHelper = createDataTableColumnHelper<AdminBundleRow>()

const columns = [
  columnHelper.accessor("customer_name", {
    header: "Customer",
    cell: ({ getValue }) => getValue() || "—",
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("bundle_name", {
    header: "Bundle",
  }),
  columnHelper.accessor("delivery_date", {
    header: "Delivery Date",
    cell: ({ getValue }) =>
      new Date(getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor("created_at", {
    header: "Created",
    cell: ({ getValue }) =>
      new Date(getValue()).toLocaleDateString(),
  }),
]

/* =======================
   Page Component
======================= */

const AdminBundlesPage = () => {
  const limit = 15

  const [pagination, setPagination] =
    useState<DataTablePaginationState>({
      pageIndex: 0,
      pageSize: limit,
    })

  // Default to TODAY
  const [selectedDate, setSelectedDate] = useState(
    formatDate(new Date())
  )

  const offset = useMemo(
    () => pagination.pageIndex * limit,
    [pagination.pageIndex]
  )

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bundles", selectedDate, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        delivery_date: selectedDate,
      })

      const res = await fetch(
        `/admin/bundles?${params.toString()}`,
        { credentials: "include" }
      )

      if (!res.ok) {
        throw new Error("Failed to load deliveries")
      }

      return res.json() as Promise<BundlesResponse>
    },
  })

  const table = useDataTable({
    columns,
    data: data?.bundles ?? [],
    rowCount: data?.count ?? 0,
    isLoading,
    getRowId: (row) => row.bundle_id,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <Container className="p-0">
      <DataTable instance={table}>
        {/* Header */}
        <DataTable.Toolbar className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading level="h1">
              Deliveries for{" "}
              {new Date(selectedDate).toLocaleDateString()}
            </Heading>
            <p className="text-sm text-ui-fg-muted">
              Customer bundles scheduled for this date
            </p>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-ui-fg-subtle">
              Delivery date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: 0,
                }))
              }}
              className="rounded-md border px-3 py-1 text-sm"
            />
          </div>
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

/* =======================
   Admin Navigation Config
======================= */

export const config = defineRouteConfig({
  label: "Delivery Schedule",
})

export default AdminBundlesPage
