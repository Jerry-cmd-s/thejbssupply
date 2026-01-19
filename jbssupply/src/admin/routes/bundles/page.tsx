"use client"

import {
  Container,
  DataTable,
  Heading,
  createDataTableColumnHelper,
  useDataTable,
  DataTablePaginationState,
  Badge,
} from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

/* =======================
   Types
======================= */

type BundleProduct = {
  title: string
  quantity: number
}

type AdminBundleRow = {
  bundle_id: string
  bundle_name: string
  customer_name: string
  email: string
  next_delivery_date?: string
  products?: BundleProduct[]
}

type BundlesResponse = {
  bundles: AdminBundleRow[]
}

/* =======================
   Columns
======================= */

const columnHelper =
  createDataTableColumnHelper<AdminBundleRow>()

const columns = [
  columnHelper.accessor("customer_name", {
    header: "Customer",
    cell: ({ getValue }) => getValue() || "—",
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => getValue() || "—",
  }),
  columnHelper.accessor("bundle_name", {
    header: "Bundle",
    cell: ({ getValue }) => getValue() || "—",
  }),
  columnHelper.accessor("products", {
    header: "Products",
    cell: ({ getValue }) => {
      const products = getValue() ?? []

      if (!products.length) {
        return <span className="text-ui-fg-muted">—</span>
      }

      return (
        <div className="flex flex-col gap-1">
          {products.map((p, i) => (
            <Badge key={i} size="small">
              {p.title} × {p.quantity}
            </Badge>
          ))}
        </div>
      )
    },
  }),
]

/* =======================
   Page
======================= */

const AdminBundlesPage = () => {
  const limit = 20

  const [pagination, setPagination] =
    useState<DataTablePaginationState>({
      pageIndex: 0,
      pageSize: limit,
    })

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const res = await fetch("/admin/bundles", {
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Failed to load bundles")
      }

      return res.json() as Promise<BundlesResponse>
    },
  })

  const filteredBundles = useMemo(() => {
    if (!data?.bundles) return []

    return data.bundles.filter((bundle) => {
      if (!bundle.next_delivery_date) return false

      return (
        bundle.next_delivery_date === selectedDate
      )
    })
  }, [data, selectedDate])

  const table = useDataTable({
    columns,
    data: filteredBundles,
    rowCount: filteredBundles.length,
    isLoading,
    getRowId: (row) => row.bundle_id,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <Container className="p-0 divide-y">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">
            Deliveries by Date
          </Heading>

          <div className="flex items-center gap-3">
            <span className="text-sm text-ui-fg-muted">
              Delivery date
            </span>
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
          </div>
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

/* =======================
   Navigation
======================= */

export const config = defineRouteConfig({
  label: "Bundle Deliveries",
})

export default AdminBundlesPage
