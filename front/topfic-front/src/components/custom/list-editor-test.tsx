import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ListHeader } from "./list-header";
import { EditableMediaGrid } from "./editable-media-grid";
import { SearchPanel } from "./search-panel";
import { ListMediaItem } from "./list-media-item";
import type { EditableGridItem } from "./editable-media-grid";
import type { SearchPanelItem } from "./search-panel";

// ── Mock data ────────────────────────────────────────────

const MOCK_GRID_ITEMS: EditableGridItem[] = [
  {
    id: "g1", coverUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    title: "Inception", mediaType: "Movie", year: "2010", rating: 8.4, rank: 1,
  },
  {
    id: "g2", coverUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    title: "The Dark Knight", mediaType: "Movie", year: "2008", rating: 9.0, rank: 2,
  },
  {
    id: "g3", coverUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    title: "Interstellar", mediaType: "Movie", year: "2014", rating: 8.7, rank: 3,
    review: "A breathtaking journey through space.",
  },
  {
    id: "g4", coverUrl: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
    title: "Joker", mediaType: "Movie", year: "2019", rating: 8.2, rank: 4,
  },
  {
    id: "g5", coverUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    title: "The Matrix", mediaType: "Movie", year: "1999", rating: 8.7, rank: 5,
  },
  {
    id: "g6", coverUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    title: "Fight Club", mediaType: "Movie", year: "1999", rating: 8.4, rank: 6,
  },
  {
    id: "g7", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg",
    title: "Dunkirk", mediaType: "Movie", year: "2017", rating: 7.9, rank: 7,
    review: "Iconic.",
  },
];

const MOCK_SEARCH_ITEMS: SearchPanelItem[] = [
  { id: "s1", title: "Dunkirk", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", mediaType: "Movie", year: "2017" },
  { id: "s2", title: "Cyberpunk 2077", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5p2d.jpg", mediaType: "Game", year: "2020" },
  { id: "s3", title: "Elden Ring", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5v3y.jpg", mediaType: "Game", year: "2022" },
  { id: "s4", title: "Breaking Bad", coverUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", mediaType: "Series", year: "2008" },
  { id: "s5", title: "Goodfellas", coverUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", mediaType: "Movie", year: "1990" },
  { id: "s6", title: "Stranger Things", coverUrl: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", mediaType: "Series", year: "2016" },
  { id: "s7", title: "The Godfather", coverUrl: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg", mediaType: "Movie", year: "1972" },
  { id: "s8", title: "Zelda", coverUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", mediaType: "Game", year: "2023" },
];

// ── Component ────────────────────────────────────────────

export function ListEditorTest() {
  const [gridItems, setGridItems] = useState<EditableGridItem[]>(MOCK_GRID_ITEMS);
  const [activeDrag, setActiveDrag] = useState<{
    id: string;
    title: string;
    coverUrl: string | null;
    mediaType: string;
    rank?: number;
    isGridItem: boolean;
  } | null>(null);

  // Snapshot of grid items before an external drag started (to restore if dropped outside)
  const gridSnapshot = useRef<EditableGridItem[]>(gridItems);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id);

    // Grid item
    const gridItem = gridItems.find((i) => i.id === activeId);
    if (gridItem) {
      gridSnapshot.current = gridItems;
      setActiveDrag({
        id: gridItem.id,
        title: gridItem.title,
        coverUrl: gridItem.coverUrl,
        mediaType: gridItem.mediaType,
        rank: gridItems.findIndex((i) => i.id === activeId) + 1,
        isGridItem: true,
      });
      return;
    }

    // Search panel item — take snapshot of current grid
    if (activeId.startsWith("search-")) {
      gridSnapshot.current = [...gridItems];
      const data = event.active.data.current as Record<string, unknown> | undefined;
      if (data) {
        setActiveDrag({
          id: String(data.id || ""),
          title: String(data.title || ""),
          coverUrl: String(data.coverUrl || ""),
          mediaType: String(data.mediaType || "Movie"),
          isGridItem: false,
        });
      }
    }
  }, [gridItems]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);

    // Only handle external (search panel) items
    if (!activeId.startsWith("search-")) return;

    const data = active.data.current as Record<string, unknown> | undefined;
    if (!data) return;

    const placeholderItem: EditableGridItem = {
      id: `placeholder-${activeId}`,
      title: String(data.title || "..."),
      coverUrl: String(data.coverUrl || ""),
      mediaType: String(data.mediaType || "Movie"),
      year: data.year ? String(data.year) : null,
      rank: 0,
      isPlaceholder: true,
    };

    const overIndex = gridItems.findIndex((i) => i.id === over.id);
    if (overIndex === -1) {
      // Not over a grid item — restore snapshot
      setGridItems([...gridSnapshot.current]);
      return;
    }

    // Insert placeholder at the over position, removing any previous placeholder
    const clean = gridSnapshot.current.filter((i) => !i.id.startsWith("placeholder-"));
    const next = [...clean];
    next.splice(overIndex, 0, placeholderItem);
    setGridItems(next);
  }, [gridItems]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) {
      // Dropped outside — restore snapshot
      setGridItems([...gridSnapshot.current]);
      return;
    }

    const activeId = String(active.id);

    // External drop (from SearchPanel) — commit the placeholder
    if (activeId.startsWith("search-")) {
      const data = active.data.current as Record<string, unknown> | undefined;
      if (data) {
        // Find where the placeholder is in the current gridItems
        const placeholderIndex = gridItems.findIndex((i) => i.id.startsWith("placeholder-"));
        const clean = gridSnapshot.current;
        const insertAt = placeholderIndex >= 0 ? placeholderIndex : clean.length;
        const next = [...clean];
        next.splice(insertAt, 0, {
          id: `g-${Date.now()}`,
          title: String(data.title || ""),
          coverUrl: String(data.coverUrl || ""),
          mediaType: String(data.mediaType || "Movie"),
          year: data.year ? String(data.year) : null,
          rank: 0,
        });
        setGridItems(next);
      }
      return;
    }

    // Internal reorder — remove any leftover placeholders first
    const clean = gridItems.filter((i) => !i.id.startsWith("placeholder-"));
    if (active.id !== over.id) {
      const oldIndex = clean.findIndex((i) => i.id === active.id);
      const newIndex = clean.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setGridItems(arrayMove(clean, oldIndex, newIndex));
      }
    }
  }, [gridItems]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="p-6 space-y-6">
        <div className="pl-10">
          <ListHeader
            title="Top Sci-Fi Movies"
            description="My personal list of must-watch science fiction films."
            updatedAt="June 3, 2026 at 14:30"
          />
        </div>

        <div className="flex gap-6 items-start">
          <EditableMediaGrid
            items={gridItems}
            columns={5}
            onDelete={(itemId) => setGridItems((prev) => prev.filter((i) => i.id !== itemId))}
          />
          <SearchPanel
            categories={["All", "Movie", "Game", "Series"]}
            items={MOCK_SEARCH_ITEMS}
            searchPlaceholder="Search to add..."
            className="h-162.5 shrink-0"
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null} zIndex={1000}>
        {activeDrag ? (
          <ListMediaItem
            coverUrl={activeDrag.coverUrl}
            title={activeDrag.title}
            mediaType={activeDrag.mediaType}
            rank={activeDrag.rank ?? 0}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
