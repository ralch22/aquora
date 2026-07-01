import { Container } from "@modules/common/components/ui"

const SkeletonProductPreview = () => {
  return (
    <div>
      <Container className="aspect-[9/16] w-full bg-aquora-surface aq-shimmer" />
      <div className="flex justify-between text-base-regular mt-2">
        <div className="w-2/5 h-6 bg-gray-100 aq-shimmer rounded"></div>
        <div className="w-1/5 h-6 bg-gray-100 aq-shimmer rounded"></div>
      </div>
    </div>
  )
}

export default SkeletonProductPreview
