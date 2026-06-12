import { useState, useRef, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────

export interface RelatedMediaItem {
  id: string
  title: string
  coverUrl: string | null
  mediaType: string
  year?: string | null
}

export interface RelatedMediaGroup {
  type: string
  items: RelatedMediaItem[]
}

export interface RelatedMediaProps {
  groups: RelatedMediaGroup[]
  className?: string
}

// ── Media Card ───────────────────────────────────────────

function MediaCard({ item }: { item: RelatedMediaItem }) {
  return (
    <Link
      to={`/media/${item.id}`}
      className="flex w-36 shrink-0 flex-col rounded-lg p-1 select-none transition-shadow"
    >
      {/* Cover */}
      <div className="aspect-2/3 w-full overflow-hidden rounded-md bg-muted shadow-sm">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl text-muted-foreground/50">
            ?
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-1.5 text-center">
        <p className="truncate text-xs font-medium leading-tight">
          {item.title}
        </p>
        <div className="mt-0.5 flex items-center justify-center gap-1">
          <Badge
            variant="secondary"
            className="px-1 py-0 text-[10px] leading-none"
          >
            {item.mediaType}
          </Badge>
        </div>
      </div>
    </Link>
  )
}

// ── Main Component ───────────────────────────────────────

export function RelatedMedia({ groups, className }: RelatedMediaProps) {
  const defaultTab = groups[0]?.type ?? ""

  return (
    <div className={cn("w-full", className)}>
      <Tabs defaultValue={defaultTab}>
        {/* Sticky tab triggers */}
        <div className="sticky top-0 z-10 pb-3">
          <TabsList variant="line" className="w-full justify-start gap-4">
            {groups.map((g) => (
              <TabsTrigger
                key={g.type}
                value={g.type}
                className="px-1 text-sm font-medium capitalize"
              >
                {g.type}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab content */}
        {groups.map((g) => (
          <TabsContent key={g.type} value={g.type}>
            <MediaRow items={g.items} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// ── Scrollable Row ───────────────────────────────────────

function MediaRow({ items }: { items: RelatedMediaItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateScrollButtons()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollButtons, { passive: true })
    const observer = new ResizeObserver(updateScrollButtons)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScrollButtons)
      observer.disconnect()
    }
  }, [updateScrollButtons, items])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No media in this category.
      </p>
    )
  }

  return (
    <div className="relative group/row">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow-sm transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} className="text-muted-foreground" />
        </button>
      )}

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scroll-smooth
          [&::-webkit-scrollbar]:h-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-border
          [&::-webkit-scrollbar-thumb]:rounded-full
          scrollbar-h-1.5 scrollbar-track-transparent scrollbar-thumb-border scrollbar-thumb-rounded-full"
      >
        {items.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow-sm transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} className="text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
