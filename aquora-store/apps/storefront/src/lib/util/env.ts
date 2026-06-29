export const getBaseURL = () => {
  // Canonical production host. Falls back to the real domain (not localhost) so canonical
  // tags, sitemap and robots stay correct even if NEXT_PUBLIC_BASE_URL is unset at build time.
  return process.env.NEXT_PUBLIC_BASE_URL || "https://aquora.ae"
}
