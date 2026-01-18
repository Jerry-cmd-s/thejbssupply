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
  delivery_date: string // ISO date string (YYYY-MM-DD)
  created_at: string
}

type BundlesResponse = {
  bundles: AdminBundleRow[]
  count: number
}

/* =======================
   Helpers
======================= */

const formatDate = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  return isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString()
}

const todayISO = new Date().toISOString().split("T")[0]

/* =======================
   Table Columns
======================= */

const columnHelper = createDataTableColumnHelper<AdminBundleRow>()

const columns = [
  columnHelper.accessor("delivery_date", {
    header: "Delivery Date",
    cell: ({ getValue }) => formatDate(getValue()),
  }),
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
  columnHelper.accessor("created_at", {
    header: "Created",
    cell: ({ getValue }) => formatDate(getValue()),
  }),
]

/* =======================
   Page Component
======================= */

const AdminBundlesPage = () => {
  const limit = 15

  const [selectedDate, setSelectedDate] =
    useState<string>(todayISO)

  const [pagination, setPagination] =
    useState<DataTablePaginationState>({
      pageIndex: 0,
      pageSize: limit,
    })

  const offset = useMemo(
    () => pagination.pageIndex * limit,
    [pagination.pageIndex]
  )

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-bundles",
      selectedDate,
      limit,
      offset,
    ],
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
        throw new Error("Failed to load bundles")
      }

      return res.json() as Promise<BundlesResponse>
    },
    keepPreviousData: true,
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
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <div className="space-y-1">
            <Heading level="h1">
              Deliveries for{" "}
              {formatDate(selectedDate)}
            </Heading>
          </div>

          {/* Date Picker */}
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
