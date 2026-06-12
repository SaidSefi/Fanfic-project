import { useMemo } from "react";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ListMediaItem } from "./list-media-item";
import type { ListMediaItemProps } from "./list-media-item";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────

export interface EditableGridItem extends Omit<ListMediaItemProps, "onRankChange" | "onReviewClick"> {
  /** Unique ID for drag-and-drop tracking */
  id: string;
  /** When true, renders at low opacity (used for external drag placeholders) */
  isPlaceholder?: boolean;
}

export interface EditableMediaGridProps {
  /** Items to display in the grid */
  items: EditableGridItem[];
  /** Number of columns (default 5) */
  columns?: number;
  /** Whether to show rank numbers (default true) */
  showRank?: boolean;
  /** Called when rank is edited on an item */
  onRankChange?: (itemId: string, newRank: number) => void;
  /** Called when review button is clicked */
  onReviewClick?: (itemId: string) => void;
  /** Called when delete button is clicked */
  onDelete?: (itemId: string) => void;
  /** Called when a title is clicked */
  onTitleClick?: (itemId: string) => void;
  /** Custom class name */
  className?: string;
}

// ── Sortable Item Wrapper ────────────────────────────────

interface SortableItemProps {
  item: EditableGridItem;
  index: number;
  gridClass: string;
  showRank?: boolean;
  onRankChange?: (newRank: number) => void;
  onReviewClick?: () => void;
  onDelete?: () => void;
  onTitleClick?: () => void;
}

function SortableItem({ item, index, gridClass, showRank, onRankChange, onReviewClick, onDelete, onTitleClick }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: item.isPlaceholder ? 0.3 : (isDragging ? 0.4 : 1) }}
      className={cn(gridClass, "touch-none")}
      {...attributes}
      {...listeners}
    >
      <ListMediaItem
        {...item}
        rank={index + 1}
        showRank={showRank}
        onRankChange={onRankChange}
        onReviewClick={onReviewClick}
        onDelete={onDelete}
        onTitleClick={onTitleClick}
      />
    </div>
  );
}

// ── Grid Cell Classes ────────────────────────────────────

function getCellClass(index: number, columns: number): string {
  // All cells same grid span — size difference comes from scale
  const isFirstRow = index < columns;
  const align = isFirstRow ? "items-end" : "items-start";
  const base = `col-span-1 row-span-1 p-3 flex justify-center ${align} `;

  if (index === 0) {
    // First item: 15% bigger
    return base + "[&_.group]:scale-[1.15] [&_.group]:[transform-origin:bottom_center]";
  }
  if (index === 1) {
    // Second item: 8% bigger
    return base + "[&_.group]:scale-[1.08] [&_.group]:[transform-origin:bottom_center]";
  }
  return base;
}

// ── Main Component ───────────────────────────────────────

export function EditableMediaGrid({
  items,
  columns = 5,
  showRank = true,
  onRankChange,
  onReviewClick,
  onDelete,
  onTitleClick,
  className,
}: EditableMediaGridProps) {
  const itemIds = useMemo(() => items.map((i) => i.id), [items]);

  return (
    <SortableContext items={itemIds} strategy={rectSortingStrategy}>
      <div className="p-10 overflow-hidden">
        <div
          className={cn(
            "grid gap-3 w-240",
            className
          )}
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridAutoRows: "auto",
          }}
        >
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              gridClass={getCellClass(index, columns)}
              showRank={showRank}
              onRankChange={
                onRankChange ? (newRank) => onRankChange(item.id, newRank) : undefined
              }
              onReviewClick={
                onReviewClick ? () => onReviewClick(item.id) : undefined
              }
              onDelete={
                onDelete ? () => onDelete(item.id) : undefined
              }
              onTitleClick={
                onTitleClick ? () => onTitleClick(item.id) : undefined
              }
            />
          ))}
        </div>
      </div>
    </SortableContext>
  );
}
