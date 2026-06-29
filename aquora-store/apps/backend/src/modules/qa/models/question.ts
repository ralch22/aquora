import { model } from "@medusajs/framework/utils"

// A customer product question. A question is created as `pending` (answer empty); the owner
// answers it in the admin, which sets `answer` + flips status to `published` (only published
// questions — i.e. answered ones — appear on the storefront). Nothing is fabricated.
const Question = model.define("question", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  body: model.text(),
  author_name: model.text(),
  email: model.text().nullable(),
  answer: model.text().nullable(),
  answered_by: model.text().nullable(),
  status: model
    .enum(["pending", "published", "rejected"])
    .default("pending"),
})

export default Question
