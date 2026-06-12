import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Rating } from "@/components/ui/rating"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface LogMediaModalProps {
  title: string
  releaseDate?: string | null
  mediaType: string
  coverUrl: string | null
  status?: string | null
  statusOptions?: string[]
  onStatusChange?: (status: string | null) => void
  consumedDate?: Date | null
  onConsumedDateChange?: (date: Date | null) => void
  rating?: number
  onRatingChange?: (value: number) => void
  liked?: boolean
  onLikeChange?: (liked: boolean) => void
  review?: string
  onReviewChange?: (text: string) => void
  onSave?: (payload: {
    status: string | null
    rating: number
    liked: boolean
    review_text: string
    consumed_at: string | null
  }) => void | Promise<void>
  onClose?: () => void
  saving?: boolean
  className?: string
}

const DEFAULT_STATUSES = ["Wishlist", "Consuming", "Completed", "Dropped"]

const STATUS_COLORS: Record<string, string> = {
  Wishlist: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Consuming: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Dropped: "bg-purple-500/10 text-purple-600 border-purple-500/30",
}

export function LogMediaModal({
  title,
  releaseDate,
  mediaType,
  coverUrl,
  status = null,
  statusOptions = DEFAULT_STATUSES,
  onStatusChange,
  consumedDate,
  onConsumedDateChange,
  rating = 0,
  onRatingChange,
  liked = false,
  onLikeChange,
  review = "",
  onReviewChange,
  onSave,
  onClose,
  saving = false,
  className,
}: LogMediaModalProps) {
  const [internalStatus, setInternalStatus] = useState(status)
  const [internalDate, setInternalDate] = useState<Date | null>(
    consumedDate ?? null
  )
  const [internalRating, setInternalRating] = useState(rating)
  const [internalLiked, setInternalLiked] = useState(liked)
  const [internalReview, setInternalReview] = useState(review)

  const handleStatusClick = (s: string) => {
    const next = internalStatus === s ? null : s
    setInternalStatus(next)
    onStatusChange?.(next)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setInternalDate(date ?? null)
    onConsumedDateChange?.(date ?? null)
  }

  const handleClearDate = () => {
    setInternalDate(null)
    onConsumedDateChange?.(null)
  }

  const year = releaseDate ? new Date(releaseDate).getFullYear() : null

  return (
    <div
      className={cn(
        "mx-auto w-fit max-w-[95vw] rounded-xl border bg-card shadow-lg",
        className
      )}
    >
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold">{title}</h2>
          <div className="mt-1 flex items-center gap-2">
            {year && (
              <span className="text-sm text-muted-foreground">{year}</span>
            )}
            <Badge variant="secondary" className="text-[10px] uppercase">
              {mediaType}
            </Badge>
          </div>
        </div>

        {onClose && (
          <button
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            onClick={onClose}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-5 px-6 pb-6">
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <div className="h-65 overflow-hidden rounded-lg bg-muted shadow-sm">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={title}
                  className="h-full w-auto max-w-none object-contain"
                />
              ) : (
                <div className="flex aspect-2/3 h-full items-center justify-center text-3xl text-muted-foreground/50">
                  ?
                </div>
              )}
            </div>
          </div>

          <div className="flex w-36 shrink-0 flex-col justify-center gap-2 self-stretch">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusClick(s)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors",
                  internalStatus === s
                    ? (STATUS_COLORS[s] ??
                        "border-primary bg-primary text-primary-foreground")
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 flex-col items-center justify-start">
            <Calendar
              mode="single"
              selected={internalDate ?? undefined}
              onSelect={handleDateSelect}
              className="p-0"
            />

            {internalDate && (
              <button
                onClick={handleClearDate}
                className="mt-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear date
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Rating
              value={internalRating}
              count={5}
              size="md"
              fractions={2}
              onChange={(v) => {
                setInternalRating(v)
                onRatingChange?.(v)
              }}
            />

            {internalRating > 0 && (
              <button
                onClick={() => {
                  setInternalRating(0)
                  onRatingChange?.(0)
                }}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setInternalLiked(!internalLiked)
              onLikeChange?.(!internalLiked)
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
              internalLiked
                ? "border-red-500/50 bg-red-500/10 text-red-500"
                : "border-dashed text-muted-foreground hover:border-red-500/30"
            )}
          >
            <svg
              className="h-4 w-4"
              fill={internalLiked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {internalLiked ? "Liked" : "Like"}
          </button>
        </div>

        <div>
          <textarea
            rows={4}
            placeholder="Write a review..."
            value={internalReview}
            onChange={(e) => {
              setInternalReview(e.target.value)
              onReviewChange?.(e.target.value)
            }}
            className="w-full min-w-0 resize-y rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => {
              const consumedStr = internalDate
                ? `${internalDate.getFullYear()}-${String(internalDate.getMonth() + 1).padStart(2, "0")}-${String(internalDate.getDate()).padStart(2, "0")}`
                : null
              onSave?.({
                status: internalStatus,
                rating: internalRating,
                liked: internalLiked,
                review_text: internalReview,
                consumed_at: consumedStr,
              })
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
