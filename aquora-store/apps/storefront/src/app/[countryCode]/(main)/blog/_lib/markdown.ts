import fs from "fs"
import path from "path"
import { marked } from "marked"

const CONTENT_ROOT = "src/lib/aquora/content"

/**
 * Some of the prepared markdown files contain authoring artifacts:
 * leading "(no content)" / "Assistant" / "Here is the article." lines,
 * a wrapping ```markdown ... ``` code fence, and trailing model notes.
 * This strips those so the real document (starting at the first `# `) renders cleanly.
 */
export function sanitizeMarkdown(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").trim()

  // If the document is wrapped in a ```markdown ... ``` fence, unwrap it.
  const fenceMatch = text.match(/```(?:markdown|md)?\s*\n([\s\S]*?)\n```/)
  if (fenceMatch && fenceMatch[1].includes("# ")) {
    text = fenceMatch[1].trim()
  }

  // Only when there is no proper line-leading "# " heading: some files glue a
  // stray token straight onto the title, e.g. "(no content)\n\nAssistant# How…".
  // Detach a level-1 "# " heading (a "#" NOT preceded by another "#") that a
  // non-whitespace preamble runs into, so it becomes line-leading.
  if (!/^# .+/m.test(text)) {
    text = text.replace(/^[\s\S]*?[^\s#](# [^\n]+)/, (_m, heading) => heading)
  }

  // Drop everything before the first top-level "# " heading when one exists,
  // removing stray preambles like "Assistant" or "Here is the article.".
  const headingIdx = text.search(/^# .+/m)
  if (headingIdx > 0) {
    text = text.slice(headingIdx)
  }

  // Remove any trailing stray code-fence markers left over from unwrapping.
  text = text.replace(/\n?```[\s\S]*$/, "").trim()

  return text
}

/** Read + sanitize a markdown file relative to the content root. */
export function readContentMarkdown(relativePath: string): string {
  const abs = path.join(process.cwd(), CONTENT_ROOT, relativePath)
  const raw = fs.readFileSync(abs, "utf-8")
  return sanitizeMarkdown(raw)
}

/** Read, sanitize and convert a markdown file to HTML. */
export async function renderContentMarkdown(relativePath: string): Promise<string> {
  const md = readContentMarkdown(relativePath)
  return marked.parse(md)
}

/** Extract the first "# " heading text from sanitized markdown. */
export function extractTitle(md: string, fallback: string): string {
  const match = md.match(/^# (.+)$/m)
  return match ? match[1].trim() : fallback
}

/** Extract the first non-heading paragraph as a plain-text excerpt. */
export function extractExcerpt(md: string, maxLength = 200): string {
  const lines = md.split("\n")
  let started = false
  const paragraph: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!started) {
      if (/^# /.test(trimmed)) {
        started = true
      }
      continue
    }
    if (!trimmed) {
      if (paragraph.length) break
      continue
    }
    // Skip secondary headings / list markers between the title and first paragraph.
    if (/^#{1,6} /.test(trimmed) || /^[-*]\s/.test(trimmed)) {
      if (paragraph.length) break
      continue
    }
    paragraph.push(trimmed)
  }

  let excerpt = paragraph
    .join(" ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`/g, "")
    .trim()

  if (excerpt.length > maxLength) {
    excerpt = excerpt.slice(0, maxLength).replace(/\s+\S*$/, "") + "…"
  }

  return excerpt
}
