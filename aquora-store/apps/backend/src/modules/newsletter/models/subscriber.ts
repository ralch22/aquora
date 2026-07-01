import { model } from "@medusajs/framework/utils"

// A newsletter subscriber — the owned marketing list. Captured from the footer signup (or other
// sources). `email` is unique so re-subscribing is idempotent; `consent` records the explicit
// opt-in, `source` where they signed up. Framework adds created_at/updated_at/deleted_at.
const Subscriber = model.define("newsletter_subscriber", {
  id: model.id().primaryKey(),
  email: model.text().unique(),
  consent: model.boolean().default(false),
  source: model.text().default("footer"),
})

export default Subscriber
