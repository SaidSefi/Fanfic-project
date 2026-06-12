import { useState, useRef, useEffect } from "react"
import { Plus, Search, X, ChevronDown } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ReviewCard } from "./review-card"
import type { ReviewCardProps } from "./review-card"
import { cn } from "@/lib/utils"

export type ReviewData = Omit<ReviewCardProps, "className" | "onReadMore" | "onClick">

const MEDIA_TYPES = ["All", "Movie", "TV Show", "Game", "Anime", "Manga"];

export interface ReviewShowcaseProps {
  /** Showcase title */
  title: string
  /** Reviews to display */
  reviews: ReviewData[]
  /** Position/rank of this showcase (1-based) */
  position?: number
  /** Whether in edit mode */
  isEditing?: boolean
  /** Called when title changes */
  onTitleChange?: (value: string) => void
  /** Called when position changes */
  onPositionChange?: (newPosition: number) => void
  /** Called when user wants to add a review (passes the selected review id) */
  onAddReview?: (reviewId: string) => void
  /** Called when user wants to remove a review */
  onRemoveReview?: (reviewId: string) => void
  /** Called when a review card is clicked */
  onReviewClick?: (reviewId: string) => void
  /** Called when "see more" is clicked on a review */
  onReadMore?: (reviewId: string) => void
  /** Called when the search query changes (for server-side search) */
  onSearch?: (query: string) => void
  /** Called when user wants to delete this entire showcase */
  onDeleteShowcase?: () => void
  /** Called when reviews are reordered via drag-and-drop */
  onReorder?: (reviews: ReviewData[]) => void
  /** Searchable reviews for the add popup */
  searchableReviews?: { id: string; title: string; mediaType?: string }[]
  /** Custom class name */
  className?: string
}

// ── Sortable Review Item ────────────────────────────────

function SortableReviewItem({
  review,
  isEditing,
  onRemoveReview,
  onReviewClick,
  onReadMore,
}: {
  review: ReviewData
  isEditing: boolean
  onRemoveReview?: (id: string) => void
  onReviewClick?: (id: string) => void
  onReadMore?: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: review.title + review.date })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle */}
      {isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
          aria-label={`Drag ${review.title}`}
        />
      )}

      <ReviewCard
        {...review}
        onClick={() => onReviewClick?.(review.title)}
        onReadMore={() => onReadMore?.(review.title)}
      />

      {/* Delete button — centered red circle */}
      {isEditing && onRemoveReview && (
        <button
          className="absolute inset-0 m-auto h-9 w-9 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-red-600 hover:shadow-xl z-20"
          onClick={(e) => {
            e.stopPropagation()
            onRemoveReview(review.title)
          }}
          aria-label="Remove review"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────

export function ReviewShowcase({
  title,
  reviews,
  position,
  isEditing = false,
  onTitleChange,
  onPositionChange,
  onAddReview,
  onRemoveReview,
  onReviewClick,
  onReadMore,
  onSearch,
  onDeleteShowcase,
  onReorder,
  searchableReviews = [],
  className,
}: ReviewShowcaseProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState("")
  const [mediaFilter, setMediaFilter] = useState("All")
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [editingPosition, setEditingPosition] = useState(false)
  const [positionValue, setPositionValue] = useState(String(position ?? ""))
  const positionInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const typeDropdownRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // Sync position prop
  useEffect(() => {
    setPositionValue(String(position ?? ""))
  }, [position])

  // Focus position input
  useEffect(() => {
    if (editingPosition && positionInputRef.current) {
      positionInputRef.current.focus()
      positionInputRef.current.select()
    }
  }, [editingPosition])

  // Close search on outside click
  useEffect(() => {
    if (!showSearch) return
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
        setQuery("")
        setMediaFilter("All")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showSearch])

  // Close type dropdown on outside click
  useEffect(() => {
    if (!showTypeDropdown) return
    const handleClick = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showTypeDropdown])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    onSearch?.(value)
  }

  const commitPosition = () => {
    const parsed = parseInt(positionValue, 10)
    if (!isNaN(parsed) && parsed > 0) {
      onPositionChange?.(parsed)
    } else {
      setPositionValue(String(position ?? ""))
    }
    setEditingPosition(false)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = reviews.findIndex((r) => r.title + r.date === active.id)
    const newIndex = reviews.findIndex((r) => r.title + r.date === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder?.(arrayMove(reviews, oldIndex, newIndex))
    }
  }

  const reviewIds = reviews.map((r) => r.title + r.date)

  const filtered = searchableReviews.filter((r) => {
    const matchesQuery = r.title.toLowerCase().includes(query.toLowerCase())
    const matchesType = mediaFilter === "All" || r.mediaType === mediaFilter
    return matchesQuery && matchesType
  })

  return (
    <div className={cn("w-full", className)}>
      {/* Title row */}
      <div className="flex items-center gap-3">
        {/* Position (edit mode) */}
        {isEditing && onPositionChange && (
          <div className="shrink-0">
            {editingPosition ? (
              <input
                ref={positionInputRef}
                type="number"
                min={1}
                value={positionValue}
                onChange={(e) => setPositionValue(e.target.value)}
                onBlur={commitPosition}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitPosition()
                  if (e.key === "Escape") {
                    setPositionValue(String(position ?? ""))
                    setEditingPosition(false)
                  }
                }}
                className="h-7 w-10 rounded-md border border-input bg-background text-center text-sm font-bold shadow-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              />
            ) : (
              <button
                className="h-7 min-w-8 px-2 rounded-md bg-muted text-foreground text-sm font-bold hover:bg-muted/80 transition-colors"
                onClick={() => setEditingPosition(true)}
                title="Click to change position"
              >
                {position}
              </button>
            )}
          </div>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditing && onTitleChange ? (
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full text-lg font-bold bg-transparent border-0 border-b border-dashed border-border px-0 py-1 focus:border-primary focus:outline-none transition-colors"
              placeholder="Showcase title"
            />
          ) : (
            <h2 className="text-lg font-bold truncate">{title}</h2>
          )}
        </div>

        {/* Delete showcase button (edit mode) */}
        {isEditing && onDeleteShowcase && (
          <button
            onClick={onDeleteShowcase}
            className="shrink-0 size-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all"
            title="Delete showcase"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="my-3 border-t border-border" />

      {/* Review list */}
      {reviews.length === 0 && !isEditing ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No reviews in this showcase.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={reviewIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {reviews.map((review) => (
                <SortableReviewItem
                  key={review.title + review.date}
                  review={review}
                  isEditing={isEditing}
                  onRemoveReview={onRemoveReview}
                  onReviewClick={onReviewClick}
                  onReadMore={onReadMore}
                />
              ))}

          {/* Add button (edit mode) */}
          {isEditing && onAddReview && (
            <div className="relative">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-border py-4 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus size={20} />
              </button>

              {/* Search popup */}
              {showSearch && (
                <div ref={searchRef} className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border bg-popover shadow-lg p-2">
                  <div className="flex gap-1.5">
                    {/* Media type dropdown */}
                    <div className="relative shrink-0" ref={typeDropdownRef}>
                      <button
                        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                        className="flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                      >
                        {mediaFilter}
                        <ChevronDown size={12} className="text-muted-foreground" />
                      </button>
                      {showTypeDropdown && (
                        <div className="absolute top-full left-0 z-30 mt-1 w-28 rounded-md border bg-popover shadow-lg py-0.5">
                          {MEDIA_TYPES.map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                setMediaFilter(type)
                                setShowTypeDropdown(false)
                              }}
                              className={cn(
                                "w-full truncate px-2 py-1 text-left text-xs hover:bg-muted transition-colors",
                                mediaFilter === type && "font-medium text-primary",
                              )}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Search input */}
                    <div className="relative flex-1">
                      <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        placeholder="Search reviewed media..."
                        className="w-full rounded-md border bg-background py-1.5 pl-8 pr-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 max-h-36 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <p className="py-2 text-center text-xs text-muted-foreground">
                        {query ? "No reviews found" : "Start typing..."}
                      </p>
                    ) : (
                      filtered.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            onAddReview(r.id)
                            setShowSearch(false)
                            setQuery("")
                          }}
                          className="w-full truncate rounded px-2 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                        >
                          {r.title}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
