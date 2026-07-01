import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useEffect, useState, useCallback } from "react"

type Insights = {
  totalTurns: number
  aiTurns: number
  totalConversations: number
  convertedConversations: number
  assistedConversionRate: number
  intents: Record<string, number>
  faqGaps: { message: string | null; at: string }[]
  windowNote: string | null
}

const INTENT_LABELS: Record<string, string> = {
  product_search: "Product search",
  recommendations: "Recommendations",
  product_detail: "Product detail",
  order_status: "Order status",
  visual_search: "Visual (photo) search",
  no_tool: "Advice / no tool",
}

const Metric = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="flex flex-col gap-1 rounded-lg border p-4">
    <Text size="xsmall" className="text-ui-fg-subtle uppercase">
      {label}
    </Text>
    <Heading level="h2">{value}</Heading>
    {sub ? (
      <Text size="xsmall" className="text-ui-fg-subtle">
        {sub}
      </Text>
    ) : null}
  </div>
)

const AskAquaInsightsPage = () => {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/admin/assistant-insights`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d && !d.error ? d : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`
  const intents = data?.intents || {}
  const maxIntent = Math.max(1, ...Object.values(intents))

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Ask-Aqua insights</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            How shoppers use the AI advisor, and which conversations lead to orders.
            {data?.windowNote ? ` (${data.windowNote})` : ""}
          </Text>
        </div>
        <Button variant="secondary" size="small" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="px-6 py-10">
          <Text className="text-ui-fg-subtle">Loading…</Text>
        </div>
      ) : !data ? (
        <div className="px-6 py-10 text-center">
          <Text className="text-ui-fg-subtle">No conversation data yet.</Text>
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Conversations" value={String(data.totalConversations)} sub={`${data.totalTurns} turns`} />
            <Metric label="Assisted orders" value={String(data.convertedConversations)} />
            <Metric label="Assisted conversion" value={pct(data.assistedConversionRate)} sub="of conversations" />
            <Metric label="AI-answered" value={data.totalTurns ? pct(data.aiTurns / data.totalTurns) : "—"} sub={`${data.aiTurns} turns`} />
          </div>

          <div>
            <Heading level="h3" className="mb-3">Intent mix</Heading>
            <div className="flex flex-col gap-2">
              {Object.keys(INTENT_LABELS).map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <Text size="small" className="w-40 shrink-0">
                    {INTENT_LABELS[k]}
                  </Text>
                  <div className="h-2 flex-1 overflow-hidden rounded bg-ui-bg-subtle">
                    <div
                      className="h-full rounded bg-ui-fg-interactive"
                      style={{ width: `${((intents[k] || 0) / maxIntent) * 100}%` }}
                    />
                  </div>
                  <Text size="small" className="w-10 shrink-0 text-right tabular-nums">
                    {intents[k] || 0}
                  </Text>
                </div>
              ))}
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-2">
              Turns can use more than one tool, so counts may overlap.
            </Text>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Heading level="h3">FAQ gaps</Heading>
              <Badge size="2xsmall" color="orange">
                {data.faqGaps.length}
              </Badge>
            </div>
            <Text size="small" className="text-ui-fg-subtle mb-3">
              Searches that returned no products — demand your catalogue isn't meeting.
            </Text>
            {data.faqGaps.length === 0 ? (
              <Text size="small" className="text-ui-fg-subtle">None — every search found matches.</Text>
            ) : (
              <div className="divide-y rounded-lg border">
                {data.faqGaps.map((g, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <Text size="small">{g.message}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle shrink-0">
                      {new Date(g.at).toLocaleDateString()}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Ask-Aqua",
  icon: ChatBubbleLeftRight,
})

export default AskAquaInsightsPage
