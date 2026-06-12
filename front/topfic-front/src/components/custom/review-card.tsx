import { Badge } from "@/components/ui/badge"
import { Rating } from "@/components/ui/rating"
import { cn } from "@/lib/utils"

export interface ReviewCardProps {
  /** Cover image URL */
  coverUrl: string | null
  /** Media title */
  title: string
  /** Media type */
  mediaType: string
  /** User's rating (0–10) */
  rating?: number | null
  /** Review creation date */
  date?: string | null
  /** Review text content */
  review: string
  /** Max visible lines before truncation (default 3) */
  maxLines?: number
  /** Called when "see more" is clicked */
  onReadMore?: () => void
  /** Called when the card is clicked */
  onClick?: () => void
  /** Custom class name */
  className?: string
}

export function ReviewCard({
  coverUrl,
  title,
  mediaType,
  rating,
  date,
  review,
  maxLines = 3,
  onReadMore,
  onClick,
  className,
}: ReviewCardProps) {
  const isLong = review.length > 200

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border bg-card p-3",
        onClick && "cursor-pointer hover:border-primary/50 transition-colors",
        className,
      )}
      onClick={onClick}
    >
      {/* Cover image */}
      <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground/50">
            ?
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {/* Top row: title + rating + date */}
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{title}</p>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {mediaType}
          </Badge>
          {rating != null && rating > 0 && (
            <span className="ml-auto flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
              <Rating
                value={rating / 2}
                count={5}
                size="xs"
                readOnly
              />
            </span>
          )}
          {date && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(date).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Review text */}
        <p
          className={cn(
            "mt-1 text-sm text-muted-foreground leading-relaxed",
            isLong && `line-clamp-${maxLines}`,
          )}
        >
          {review}
          {isLong && onReadMore && (
            <>
              {" "}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onReadMore()
                }}
                className="inline text-primary hover:underline font-medium"
              >
                see more
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
