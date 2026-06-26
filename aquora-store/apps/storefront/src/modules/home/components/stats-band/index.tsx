import homepage from "@lib/aquora/content/homepage.json"

const StatsBand = () => {
  return (
    <section className="border-b border-black/5 bg-aquora-surface">
      <div className="content-container py-14 small:py-16">
        <dl className="grid grid-cols-2 gap-y-10 gap-x-6 small:grid-cols-4">
          {homepage.stats.map((stat) => (
            <div key={stat.label} className="text-center small:text-left">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-heading text-4xl font-extrabold tracking-tight text-aquora-accent small:text-5xl">
                {stat.value}
              </dd>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-aquora-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default StatsBand
