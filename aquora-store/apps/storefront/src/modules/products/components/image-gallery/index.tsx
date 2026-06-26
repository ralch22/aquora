import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

// Premium double-bezel frames; object-contain so equipment isn't cropped.
const ImageGallery = ({ images }: ImageGalleryProps) => {
  return (
    <div className="flex flex-col gap-4 small:mx-8 lg:mx-12">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="rounded-[1.7rem] border border-black/[0.06] bg-white p-2 shadow-[0_1px_2px_rgba(11,31,36,0.04)]"
        >
          <div className="relative aspect-square overflow-hidden rounded-[1.3rem] bg-gradient-to-b from-white to-aquora-surface" id={image.id}>
            {!!image.url && (
              <Image
                src={image.url}
                priority={index <= 1}
                className="object-contain p-7"
                alt={`Product image ${index + 1}`}
                fill
                sizes="(max-width: 576px) 320px, (max-width: 992px) 520px, 700px"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ImageGallery
