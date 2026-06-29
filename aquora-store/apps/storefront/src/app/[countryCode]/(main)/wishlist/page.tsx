import { Metadata } from "next"

import WishlistView from "@modules/wishlist/templates/wishlist-view"

export const metadata: Metadata = {
  title: "Wishlist — Aquora",
  description: "Your saved pool, spa, pond and fountain equipment — ready when you are.",
}

export default function WishlistPage() {
  return <WishlistView />
}
