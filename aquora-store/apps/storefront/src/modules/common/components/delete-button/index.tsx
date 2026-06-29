import { deleteLineItem } from "@lib/data/cart"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"

const DeleteButton = ({
  id,
  children,
  className,
}: {
  id: string
  children?: React.ReactNode
  className?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    setError(null)
    await deleteLineItem(id).catch((_err) => {
      setIsDeleting(false)
      setError("Couldn't remove this — please try again.")
    })
  }

  return (
    <div
      className={clx(
        "flex flex-col text-small-regular",
        className
      )}
    >
      <button
        className="flex gap-x-1 text-aquora-muted hover:text-aquora-ink cursor-pointer disabled:opacity-60"
        onClick={() => handleDelete(id)}
        disabled={isDeleting}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
      {error && (
        <span role="alert" className="mt-1 text-xs text-rose-600">
          {error}
        </span>
      )}
    </div>
  )
}

export default DeleteButton
