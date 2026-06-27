// Aquora edge reverse-proxy (Cloudflare Worker).
// Fronts the custom domains and forwards to the Cloud Run services, rewriting the Host
// header to the run.app hostname (Cloud Run routes by Host, so this is mandatory). Also
// 301s the www + .store variants to the canonical apex, and rewrites any redirect Location
// that leaks the run.app origin back to the public host.
const STORE = "aquora-storefront-250350263461.europe-west1.run.app"
const API = "aquora-backend-250350263461.europe-west1.run.app"

const ORIGINS = {
  "aquora.ae": STORE,
  "api.aquora.ae": API,
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const host = url.hostname

    // Canonicalise: www + the .store domain redirect to the apex store.
    if (host === "www.aquora.ae" || host === "aquora.store" || host === "www.aquora.store") {
      return Response.redirect("https://aquora.ae" + url.pathname + url.search, 301)
    }

    const origin = ORIGINS[host]
    if (!origin) return new Response("Unknown host", { status: 404 })

    url.hostname = origin
    url.protocol = "https:"
    url.port = ""

    const req = new Request(url.toString(), request)
    req.headers.set("X-Forwarded-Host", host)
    req.headers.set("X-Forwarded-Proto", "https")

    const resp = await fetch(req, { redirect: "manual" })

    // Don't let an origin redirect bounce the user onto the run.app hostname.
    const loc = resp.headers.get("Location")
    if (loc && loc.includes(origin)) {
      const r = new Response(resp.body, resp)
      r.headers.set("Location", loc.split(origin).join(host))
      return r
    }
    return resp
  },
}
