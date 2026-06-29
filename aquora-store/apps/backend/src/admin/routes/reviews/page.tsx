import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Star } from "@medusajs/icons"
import { Container, Heading, Badge, Button, Text, Select, toast } from "@medusajs/ui"
import { useEffect, useState, useCallback } from "react"

type Review = {
  id: string
  product_id: string
  rating: number
  title: string | null
  body: string
  author_name: string
  email: string | null
  order_id: string | null
  verified: boolean
  status: "pending" | "approved" | "rejected"
  created_at: string
}

const STATUSES = ["pending", "approved", "rejected", "all"] as const

const Stars = ({ n }: { n: number }) => (
  <span style={{ color: "#E0A23B", letterSpacing: 1 }}>
    {"★".repeat(Math.max(0, Math.min(5, Math.round(n))))}
    <span style={{ color: "#cbd5e1" }}>{"★".repeat(5 - Math.max(0, Math.min(5, Math.round(n))))}</span>
  </span>
)

const ReviewsPage = () => {
  const [status, setStatus] = useState<string>("pending")
  const [rows, setRows] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/admin/reviews?status=${status}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.reviews || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id: string, next: string, del = false) => {
    setBusy(id)
    try {
      const res = await fetch(`/admin/reviews/${id}`, {
        method: del ? "DELETE" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: del ? undefined : JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error()
      toast.success(del ? "Review deleted" : `Review ${next}`)
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch {
      toast.error("Action failed")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Product reviews</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Approve reviews to publish them on the storefront. Verified-purchase reviews are auto-approved.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <Select.Trigger className="w-40">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {STATUSES.map((s) => (
                <Select.Item key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <Button variant="secondary" size="small" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-10">
          <Text className="text-ui-fg-subtle">Loading…</Text>
        </div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Text className="text-ui-fg-subtle">No {status === "all" ? "" : status} reviews.</Text>
        </div>
      ) : (
        <div className="divide-y">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 px-6 py-4">
              <div className="flex items-center gap-3">
                <Stars n={r.rating} />
                <Text weight="plus">{r.title || "(no title)"}</Text>
                {r.verified && (
                  <Badge color="green" size="2xsmall">
                    Verified purchase
                  </Badge>
                )}
                <Badge
                  color={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "orange"}
                  size="2xsmall"
                >
                  {r.status}
                </Badge>
              </div>
              <Text size="small">{r.body}</Text>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {r.author_name}
                {r.email ? ` · ${r.email}` : ""} · product {r.product_id}
                {r.order_id ? ` · order ${r.order_id}` : ""} · {new Date(r.created_at).toLocaleString()}
              </Text>
              <div className="mt-1 flex gap-2">
                {r.status !== "approved" && (
                  <Button size="small" variant="primary" disabled={busy === r.id} onClick={() => act(r.id, "approved")}>
                    Approve
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button size="small" variant="secondary" disabled={busy === r.id} onClick={() => act(r.id, "rejected")}>
                    Reject
                  </Button>
                )}
                <Button size="small" variant="danger" disabled={busy === r.id} onClick={() => act(r.id, "", true)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Reviews",
  icon: Star,
})

export default ReviewsPage
