// Parallel-route fallback: when the URL has no matching segment for the @login slot
// (e.g. /account/orders), render nothing so the @dashboard slot can render alone.
export default function Default() {
  return null
}
