import { useState, useRef, useEffect } from "react"
import { Plus, Search, X } from "lucide-react"
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
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ListCard } from "./list-card"
import type { ListCardData } from "./user-lists-panel"
import { cn } from "@/lib/utils"

export type { ListCardData }

export interface ListShowcaseProps {
  /** Showcase title */
  title: string
  /** Lists to display */
  lists: ListCardData[]
  /** Position/rank of this showcase (1-based) */
  position?: number
  /** Whether in edit mode (shows + button and search) */
  isEditing?: boolean
  /** Called when title changes */
  onTitleChange?: (value: string) => void
  /** Called when position changes */
  onPositionChange?: (newPosition: number) => void
  /** Called when user wants to add a list (passes the selected list id) */
  onAddList?: (listId: string) => void
  /** Called when user wants to remove a list */
  onRemoveList?: (listId: string) => void
  /** Called when a list card is clicked */
  onListClick?: (listId: string) => void
  /** Called when the search query changes (for server-side search) */
  onSearch?: (query: string) => void
  /** Called when user wants to delete this entire showcase */
  onDeleteShowcase?: () => void
  /** Called when lists are reordered via drag-and-drop */
  onReorder?: (lists: ListCardData[]) => void
  /** Available lists to search from (for the add popup) */
  searchableLists?: { id: string; title: string }[]
  /** Custom class name */
  className?: string
}

// ── Sortable List Item ──────────────────────────────────

function SortableListItem({
  list,
  isEditing,
  onRemoveList,
  onListClick,
}: {
  list: ListCardData
  isEditing: boolean
  onRemoveList?: (id: string) => void
  onListClick?: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle — invisible overlay */}
      {isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
          aria-label={`Drag ${list.title}`}
        />
      )}

      <ListCard
        title={list.title}
        coverUrls={list.coverUrls}
        truncate
        onClick={() => onListClick?.(list.id)}
      />

      {/* Delete button — centered red circle */}
      {isEditing && onRemoveList && (
        <button
          className="absolute inset-0 m-auto h-9 w-9 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-red-600 hover:shadow-xl z-20"
          onClick={(e) => {
            e.stopPropagation()
            onRemoveList(list.id)
          }}
          aria-label="Remove list"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────

export function ListShowcase({
  title,
  lists,
  position,
  isEditing = false,
  onTitleChange,
  onPositionChange,
  onAddList,
  onRemoveList,
  onListClick,
  onSearch,
  onDeleteShowcase,
  onReorder,
  searchableLists = [],
  className,
}: ListShowcaseProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState("")
  const [editingPosition, setEditingPosition] = useState(false)
  const [positionValue, setPositionValue] = useState(String(position ?? ""))
  const positionInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

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
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showSearch])

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
    const oldIndex = lists.findIndex((l) => l.id === active.id)
    const newIndex = lists.findIndex((l) => l.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder?.(arrayMove(lists, oldIndex, newIndex))
    }
  }

  const filtered = searchableLists.filter((l) =>
    l.title.toLowerCase().includes(query.toLowerCase()),
  )

  const listIds = lists.map((l) => l.id)

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

      {/* List grid */}
      {lists.length === 0 && !isEditing ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No lists in this showcase.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={listIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {lists.map((list) => (
                <SortableListItem
                  key={list.id}
                  list={list}
                  isEditing={isEditing}
                  onRemoveList={onRemoveList}
                  onListClick={onListClick}
                />
              ))}

              {/* Add button (edit mode) */}
              {isEditing && onAddList && (
                <div className="relative">
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus size={24} />
                  </button>

                  {/* Search popup */}
                  {showSearch && (
                    <div ref={searchRef} className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border bg-popover shadow-lg p-2">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                        />
                        <input
                          autoFocus
                          value={query}
                          onChange={(e) => handleQueryChange(e.target.value)}
                          placeholder="Search your lists..."
                          className="w-full rounded-md border bg-background py-1.5 pl-8 pr-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div className="mt-1.5 max-h-36 overflow-y-auto">
                        {filtered.length === 0 ? (
                          <p className="py-2 text-center text-xs text-muted-foreground">
                            {query ? "No lists found" : "Start typing..."}
                          </p>
                        ) : (
                          filtered.map((l) => (
                            <button
                              key={l.id}
                              onClick={() => {
                                onAddList(l.id)
                                setShowSearch(false)
                                setQuery("")
                              }}
                              className="w-full truncate rounded px-2 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                            >
                              {l.title}
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
