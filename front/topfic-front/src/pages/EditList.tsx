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
import { ListHeader } from "@/components/custom/list-header";
import { EditableMediaGrid } from "@/components/custom/editable-media-grid";
import { SearchPanel } from "@/components/custom/search-panel";
import { ListMediaItem } from "@/components/custom/list-media-item";
import { Button } from "@/components/ui/button";
import type { EditableGridItem } from "@/components/custom/editable-media-grid";
import type { SearchPanelItem } from "@/components/custom/search-panel";

// ── Mock data (replace with API calls later) ─────────────

const INITIAL_ITEMS: EditableGridItem[] = [
  { id: "g1", coverUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", title: "Inception", mediaType: "Movie", year: "2010", rating: 8.4, rank: 1 },
  { id: "g2", coverUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", title: "The Dark Knight", mediaType: "Movie", year: "2008", rating: 9.0, rank: 2 },
  { id: "g3", coverUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", title: "Interstellar", mediaType: "Movie", year: "2014", rating: 8.7, rank: 3, review: "A breathtaking journey through space." },
  { id: "g4", coverUrl: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", title: "Joker", mediaType: "Movie", year: "2019", rating: 8.2, rank: 4 },
  { id: "g5", coverUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", title: "The Matrix", mediaType: "Movie", year: "1999", rating: 8.7, rank: 5 },
  { id: "g6", coverUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", title: "Fight Club", mediaType: "Movie", year: "1999", rating: 8.4, rank: 6 },
  { id: "g7", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Dunkirk", mediaType: "Movie", year: "2017", rating: 7.9, rank: 7, review: "Iconic." },
  { id: "g8", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Avengers: Endgame", mediaType: "Movie", year: "2019", rating: 8.3, rank: 8 },
  { id: "g9", coverUrl: "", title: "The Lord of the Rings", mediaType: "Movie", year: "2001", rating: 8.9, rank: 9 },
  { id: "g10", coverUrl: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", title: "Pulp Fiction", mediaType: "Movie", year: "1994", rating: 8.9, rank: 10 },
  { id: "g11", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Gladiator", mediaType: "Movie", year: "2000", rating: 8.5, rank: 11 },
  { id: "g12", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Goodfellas", mediaType: "Movie", year: "1990", rating: 8.7, rank: 12 },
  { id: "g13", coverUrl: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", title: "The Prestige", mediaType: "Movie", year: "2006", rating: 8.5, rank: 13 },
  { id: "g14", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Parasite", mediaType: "Movie", year: "2019", rating: 8.5, rank: 14 },
  { id: "g15", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Whiplash", mediaType: "Movie", year: "2014", rating: 8.5, rank: 15 },
  { id: "g16", coverUrl: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", title: "Se7en", mediaType: "Movie", year: "1995", rating: 8.6, rank: 16 },
  { id: "g17", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Batman Begins", mediaType: "Movie", year: "2005", rating: 8.2, rank: 17 },
  { id: "g18", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Memento", mediaType: "Movie", year: "2000", rating: 8.4, rank: 18 },
  { id: "g19", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Tenet", mediaType: "Movie", year: "2020", rating: 7.4, rank: 19 },
  { id: "g20", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Blade Runner 2049", mediaType: "Movie", year: "2017", rating: 8.0, rank: 20 },
  { id: "g21", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "The Lion King", mediaType: "Movie", year: "1994", rating: 8.5, rank: 21 },
  { id: "g22", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "The Departed", mediaType: "Movie", year: "2006", rating: 8.5, rank: 22 },
  { id: "g23", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Inglourious Basterds", mediaType: "Movie", year: "2009", rating: 8.3, rank: 23 }
];

const SEARCH_ITEMS: SearchPanelItem[] = [
  { id: "s1", title: "Dunkirk", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", mediaType: "Movie", year: "2017" },
  { id: "s2", title: "Cyberpunk 2077", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5p2d.jpg", mediaType: "Game", year: "2020" },
  { id: "s3", title: "Elden Ring", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5v3y.jpg", mediaType: "Game", year: "2022" },
  { id: "s4", title: "Breaking Bad", coverUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", mediaType: "Series", year: "2008" },
  { id: "s5", title: "Goodfellas", coverUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", mediaType: "Movie", year: "1990" },
  { id: "s6", title: "Stranger Things", coverUrl: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", mediaType: "Series", year: "2016" },
  { id: "s7", title: "The Godfather", coverUrl: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg", mediaType: "Movie", year: "1972" },
  { id: "s8", title: "Zelda", coverUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", mediaType: "Game", year: "2023" },
];

// ── Page Component ───────────────────────────────────────

export default function EditList() {
  const [listTitle, setListTitle] = useState("Top Sci-Fi Movies");
  const [listDescription, setListDescription] = useState("My personal list of must-watch science fiction films.");
  const [gridItems, setGridItems] = useState<EditableGridItem[]>(INITIAL_ITEMS);
  const [activeDrag, setActiveDrag] = useState<{
    id: string; title: string; coverUrl: string | null; mediaType: string; rank?: number; isGridItem: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const gridSnapshot = useRef<EditableGridItem[]>(gridItems);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id);
    const gridItem = gridItems.find((i) => i.id === activeId);
    if (gridItem) {
      gridSnapshot.current = gridItems;
      setActiveDrag({ ...gridItem, rank: gridItems.findIndex((i) => i.id === activeId) + 1, isGridItem: true });
      return;
    }
    if (activeId.startsWith("search-")) {
      gridSnapshot.current = [...gridItems];
      const data = event.active.data.current as Record<string, unknown> | undefined;
      if (data) {
        setActiveDrag({ id: String(data.id || ""), title: String(data.title || ""), coverUrl: String(data.coverUrl || ""), mediaType: String(data.mediaType || "Movie"), isGridItem: false });
      }
    }
  }, [gridItems]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    if (!activeId.startsWith("search-")) return;
    const data = active.data.current as Record<string, unknown> | undefined;
    if (!data) return;
    const placeholder: EditableGridItem = { id: `placeholder-${activeId}`, title: String(data.title || "..."), coverUrl: String(data.coverUrl || ""), mediaType: String(data.mediaType || "Movie"), year: data.year ? String(data.year) : null, rank: 0, isPlaceholder: true };
    const overIndex = gridItems.findIndex((i) => i.id === over.id);
    if (overIndex === -1) { setGridItems([...gridSnapshot.current]); return; }
    const clean = gridSnapshot.current.filter((i) => !i.id.startsWith("placeholder-"));
    const next = [...clean];
    next.splice(overIndex, 0, placeholder);
    setGridItems(next);
  }, [gridItems]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) { setGridItems([...gridSnapshot.current]); return; }
    const activeId = String(active.id);
    if (activeId.startsWith("search-")) {
      const data = active.data.current as Record<string, unknown> | undefined;
      if (data) {
        const placeholderIndex = gridItems.findIndex((i) => i.id.startsWith("placeholder-"));
        const clean = gridSnapshot.current;
        const insertAt = placeholderIndex >= 0 ? placeholderIndex : clean.length;
        const next = [...clean];
        next.splice(insertAt, 0, {
          id: `g-${Date.now()}`, title: String(data.title || ""), coverUrl: String(data.coverUrl || ""), mediaType: String(data.mediaType || "Movie"), year: data.year ? String(data.year) : null, rank: 0,
        });
        setGridItems(next);
      }
      return;
    }
    const clean = gridItems.filter((i) => !i.id.startsWith("placeholder-"));
    if (active.id !== over.id) {
      const oldIndex = clean.findIndex((i) => i.id === active.id);
      const newIndex = clean.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) setGridItems(arrayMove(clean, oldIndex, newIndex));
    }
  }, [gridItems]);

  const handleSave = () => {
    setSaving(true);
    // TODO: API call to save the list
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex justify-center p-6">
        <div className="space-y-6">
          <div className="pl-10">
          <ListHeader
            title={listTitle}
            description={listDescription}
            updatedAt="June 3, 2026 at 14:30"
            onTitleChange={setListTitle}
            onDescriptionChange={setListDescription}
          />
        </div>

        <div className="flex gap-6 items-start">
          <EditableMediaGrid
            items={gridItems}
            columns={5}
            onDelete={(id) => setGridItems((prev) => prev.filter((i) => i.id !== id))}
          />

          {/* Vertical divider */}
          <div className="self-stretch w-px bg-border shrink-0" />

          {/* Right column: Save button + Search panel — sticky */}
          <div className="flex flex-col gap-3 shrink-0 sticky top-24">
            <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <SearchPanel
              categories={["All", "Movie", "Game", "Series"]}
              items={SEARCH_ITEMS}
              searchPlaceholder="Search to add..."
              className="h-[70vh]"
            />
          </div>
        </div>
      </div>
      </div>

      <DragOverlay dropAnimation={null} zIndex={1000}>
        {activeDrag ? (
          <ListMediaItem coverUrl={activeDrag.coverUrl} title={activeDrag.title} mediaType={activeDrag.mediaType} rank={activeDrag.rank ?? 0} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
