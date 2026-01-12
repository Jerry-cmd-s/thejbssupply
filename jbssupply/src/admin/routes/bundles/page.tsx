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
  delivery_day: number
  created_at: string
}

type BundlesResponse = {
  bundles: AdminBundleRow[]
  count: number
}

/* =======================
   Table Columns
======================= */

const columnHelper = createDataTableColumnHelper<AdminBundleRow>()

const columns = [
  columnHelper.accessor("delivery_day", {
    header: "Delivery Day",
    cell: ({ getValue }) => `Day ${getValue()}`,
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

  const [deliveryDay, setDeliveryDay] =
    useState<string>("all")

  const offset = useMemo(() => {
    return pagination.pageIndex * limit
  }, [pagination.pageIndex])

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bundles", limit, offset, deliveryDay],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: String(limit),
        offset: String(offset),
      }

      if (deliveryDay !== "all") {
        params.delivery_day = deliveryDay
      }

      const res = await fetch(
        `/admin/bundles?${new URLSearchParams(params)}`,
        {
          credentials: "include",
        }
      )

      if (!res.ok) {
        throw new Error("Failed to load bundles")
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
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">
            Monthly Delivery Schedule
          </Heading>

          {/* Delivery Day Filter */}
          <select
            className="rounded-md border px-3 py-1 text-sm"
            value={deliveryDay}
            onChange={(e) => {
              setDeliveryDay(e.target.value)
              setPagination((prev) => ({
                ...prev,
                pageIndex: 0,
              }))
            }}
          >
            <option value="all">
              All delivery days
            </option>
            {Array.from({ length: 31 }).map((_, i) => (
              <option
                key={i + 1}
                value={String(i + 1)}
              >
                Day {i + 1}
              </option>
            ))}
          </select>
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
  label: " Customer's Bundles Delivery",
})

export default AdminBundlesPage
