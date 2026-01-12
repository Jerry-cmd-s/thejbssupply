import {
  Container,
  DataTable,
  Heading,
  createDataTableColumnHelper,
  useDataTable,
  DataTablePaginationState,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"

type AdminBundleRow = {
  customer_id: string
  customer_name: string
  email: string
  bundle_id: string
  bundle_name: string
  delivery_day: number
  created_at: string
}

type BundlesResponse = {
  bundles: AdminBundleRow[]
  count: number
}

const columnHelper = createDataTableColumnHelper<AdminBundleRow>()

const columns = [
  columnHelper.accessor("delivery_day", {
    header: "Delivery Day",
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

const AdminBundlesPage = () => {
  const limit = 15

  const [pagination, setPagination] =
    useState<DataTablePaginationState>({
      pageSize: limit,
      pageIndex: 0,
    })

  const offset = useMemo(
    () => pagination.pageIndex * limit,
    [pagination.pageIndex]
  )

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bundles", limit, offset],
    queryFn: async () => {
      const res = await fetch(
        `/admin/bundles?limit=${limit}&offset=${offset}`,
        {
          credentials: "include",
        }
      )

      if (!res.ok) {
        throw new Error("Failed to fetch bundles")
      }

      return (await res.json()) as BundlesResponse
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
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Bundles",
})

export default AdminBundlesPage
