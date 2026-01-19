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

type BundleSchedule = {
  start_date: string
  interval_type: "months"
  interval_count: number
  day_of_month: number
}

type AdminBundleRow = {
  bundle_id: string
  bundle_name: string
  customer_name: string
  email: string
  products: BundleProduct[]
  schedule: BundleSchedule
  created_at: string
}

type BundlesResponse = {
  bundles: AdminBundleRow[]
  count: number
}

/* =======================
   Helpers
======================= */

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const bundleDeliversOnDate = (
  schedule: BundleSchedule,
  selectedDate: Date
) => {
  const start = new Date(schedule.start_date)
  if (selectedDate < start) return false

  if (schedule.interval_type !== "months") return false

  const monthDiff =
    (selectedDate.getFullYear() - start.getFullYear()) * 12 +
    (selectedDate.getMonth() - start.getMonth())

  if (monthDiff % schedule.interval_count !== 0) return false

  return selectedDate.getDate() === schedule.day_of_month
}

/* =======================
   Table Columns
======================= */

const columnHelper =
  createDataTableColumnHelper<AdminBundleRow>()

const columns = [
  columnHelper.accessor("customer_name", {
    header: "Customer",
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("bundle_name", {
    header: "Bundle",
  }),
  columnHelper.accessor("products", {
    header: "Products",
    cell: ({ getValue }) => (
      <div className="flex flex-col gap-1">
        {getValue().map((p, i) => (
          <Badge key={i} size="small">
            {p.title} × {p.quantity}
          </Badge>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor("schedule.start_date", {
    header: "Start Date",
    cell: ({ getValue }) =>
      new Date(getValue()).toLocaleDateString(),
  }),
]

/* =======================
   Page Component
======================= */

const AdminBundlesPage = () => {
  const limit = 20

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  const [pagination, setPagination] =
    useState<DataTablePaginationState>({
      pageIndex: 0,
      pageSize: limit,
    })

  const offset =
    pagination.pageIndex * pagination.pageSize

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
    if (!data) return []

    const date = new Date(selectedDate)

    return data.bundles.filter((bundle) =>
      bundleDeliversOnDate(bundle.schedule, date)
    )
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
            Delivery Schedule
          </Heading>

          <input
            type="date"
            className="rounded-md border px-3 py-1 text-sm"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setPagination((p) => ({
                ...p,
                pageIndex: 0,
              }))
            }}
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
  label: "Bundle Deliveries",
})

export default AdminBundlesPage
