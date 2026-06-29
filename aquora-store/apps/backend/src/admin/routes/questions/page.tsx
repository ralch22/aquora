import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Container, Heading, Badge, Button, Text, Select, Textarea, toast } from "@medusajs/ui"
import { useEffect, useState, useCallback } from "react"

type Question = {
  id: string
  product_id: string
  body: string
  author_name: string
  email: string | null
  answer: string | null
  answered_by: string | null
  status: "pending" | "published" | "rejected"
  created_at: string
}

const STATUSES = ["pending", "published", "rejected", "all"] as const

const QuestionsPage = () => {
  const [status, setStatus] = useState<string>("pending")
  const [rows, setRows] = useState<Question[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/admin/questions?status=${status}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.questions || [])
        const ds: Record<string, string> = {}
        for (const q of d.questions || []) ds[q.id] = q.answer || ""
        setDrafts(ds)
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const send = async (id: string, payload: any, removeFromList = true) => {
    setBusy(id)
    try {
      const res = await fetch(`/admin/questions/${id}`, {
        method: payload === null ? "DELETE" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: payload === null ? undefined : JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(payload === null ? "Deleted" : payload.status === "published" ? "Answer published" : "Updated")
      if (removeFromList) setRows((prev) => prev.filter((r) => r.id !== id))
    } catch {
      toast.error("Action failed")
    } finally {
      setBusy(null)
    }
  }

  const publish = (q: Question) => {
    const answer = (drafts[q.id] || "").trim()
    if (answer.length < 2) {
      toast.error("Write an answer first")
      return
    }
    send(q.id, { answer, status: "published" })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Product questions</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Answer a question to publish it on the storefront. Customers are notified you replied via the product page.
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
          <Text className="text-ui-fg-subtle">No {status === "all" ? "" : status} questions.</Text>
        </div>
      ) : (
        <div className="divide-y">
          {rows.map((q) => (
            <div key={q.id} className="flex flex-col gap-2 px-6 py-4">
              <div className="flex items-center gap-3">
                <Badge
                  color={q.status === "published" ? "green" : q.status === "rejected" ? "red" : "orange"}
                  size="2xsmall"
                >
                  {q.status}
                </Badge>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {q.author_name}
                  {q.email ? ` · ${q.email}` : ""} · product {q.product_id} · {new Date(q.created_at).toLocaleString()}
                </Text>
              </div>
              <Text weight="plus">{q.body}</Text>
              <Textarea
                placeholder="Write your answer…"
                value={drafts[q.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                rows={3}
              />
              <div className="mt-1 flex gap-2">
                <Button size="small" variant="primary" disabled={busy === q.id} onClick={() => publish(q)}>
                  {q.status === "published" ? "Update answer" : "Publish answer"}
                </Button>
                {q.status !== "rejected" && (
                  <Button size="small" variant="secondary" disabled={busy === q.id} onClick={() => send(q.id, { status: "rejected" })}>
                    Reject
                  </Button>
                )}
                <Button size="small" variant="danger" disabled={busy === q.id} onClick={() => send(q.id, null)}>
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
  label: "Questions",
  icon: ChatBubbleLeftRight,
})

export default QuestionsPage
