import { useState, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────

export interface SearchPanelItem {
  id: string;
  title: string;
  coverUrl: string | null;
  mediaType: string;
  year?: string | null;
  /** Arbitrary data passed on drag */
  data?: Record<string, unknown>;
}

export interface SearchPanelProps {
  /** Categories for the toggle buttons at the top */
  categories: string[];
  /** All items to search/filter from */
  items: SearchPanelItem[];
  /** Currently selected category */
  selectedCategory?: string;
  /** Called when a category is selected */
  onCategoryChange?: (category: string) => void;
  /** Called when the search query changes */
  onSearchChange?: (query: string) => void;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Custom class name */
  className?: string;
}

// ── Mini Grid Card (draggable) ──────────────────────────

function MiniGridCard({ item }: { item: SearchPanelItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `search-${item.id}`,
      data: {
        type: "search-result",
        ...item.data,
        id: item.id,
        title: item.title,
        coverUrl: item.coverUrl,
        mediaType: item.mediaType,
        year: item.year,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center cursor-grab active:cursor-grabbing rounded-lg hover:bg-muted/30 transition-colors p-1 select-none",
        isDragging && "opacity-40"
      )}
    >
      {/* Thumbnail */}
      <div className="w-full aspect-2/3 rounded-md overflow-hidden bg-muted shadow-sm">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg text-muted-foreground/50">
            ?
          </div>
        )}
      </div>

      {/* Info */}
      <div className="w-full mt-1 text-center">
        <p className="text-[10px] font-medium leading-tight truncate">{item.title}</p>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <Badge variant="secondary" className="text-[8px] px-1 py-0 leading-none">
            {item.mediaType}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────

export function SearchPanel({
  categories,
  items,
  selectedCategory: controlledCategory,
  onCategoryChange,
  onSearchChange,
  searchPlaceholder = "Search...",
  className,
}: SearchPanelProps) {
  const [internalCategory, setInternalCategory] = useState(categories[0] ?? "");
  const [query, setQuery] = useState("");

  const activeCategory =
    controlledCategory !== undefined ? controlledCategory : internalCategory;

  const handleCategoryClick = (cat: string) => {
    if (controlledCategory === undefined) {
      setInternalCategory(cat);
    }
    onCategoryChange?.(cat);
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearchChange?.(value);
  };

  // Filter items by search query (fake local filtering)
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.mediaType.toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === categories[0] || item.mediaType === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [items, query, activeCategory, categories]);

  return (
    <div className={cn("flex flex-col w-110", className)}>
      {/* Category toggle buttons */}
      <div className="flex border-b">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              "border-b-2 -mb-px",
              activeCategory === cat
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="p-3">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-3 text-xs shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
        </div>
      </div>

      {/* Separator */}
      <div className="border-t" />

      {/* Results — 3-column grid */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-border
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30
        scrollbar-w-1.5 scrollbar-track-transparent scrollbar-thumb-border scrollbar-thumb-rounded-full">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No results found
          </p>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {filtered.map((item) => (
            <MiniGridCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
