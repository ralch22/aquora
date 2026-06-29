import { model } from "@medusajs/framework/utils"

// A customer product review. Moderation-first: a review is created as `pending` and only shows
// on the storefront once `status === "approved"`. Reviews tied to a real, matching order are
// auto-approved and flagged `verified` (an Amazon-style "Verified Purchase" trust signal). No
// review is ever fabricated — every row is a genuine customer submission.
const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  rating: model.number(),
  title: model.text().nullable(),
  body: model.text(),
  author_name: model.text(),
  email: model.text().nullable(),
  order_id: model.text().nullable(),
  verified: model.boolean().default(false),
  status: model
    .enum(["pending", "approved", "rejected"])
    .default("pending"),
})

export default Review
