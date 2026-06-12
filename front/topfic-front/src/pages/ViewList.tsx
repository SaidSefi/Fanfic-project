import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ListHeader } from "@/components/custom/list-header";
import { EditableMediaGrid } from "@/components/custom/editable-media-grid";
import { UserListsPanel } from "@/components/custom/user-lists-panel";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { EditableGridItem } from "@/components/custom/editable-media-grid";
import type { ListCardData } from "@/components/custom/user-lists-panel";

// ── Mock data (replace with API calls later) ─────────────

const MOCK_ITEMS: EditableGridItem[] = [
  { id: "g1", coverUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", title: "Inception", mediaType: "Movie", year: "2010", rating: 8.4, rank: 1 },
  { id: "g2", coverUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", title: "The Dark Knight", mediaType: "Movie", year: "2008", rating: 9.0, rank: 2 },
  { id: "g3", coverUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", title: "Interstellar", mediaType: "Movie", year: "2014", rating: 8.7, rank: 3, review: "A breathtaking journey through space." },
  { id: "g4", coverUrl: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", title: "Joker", mediaType: "Movie", year: "2019", rating: 8.2, rank: 4 },
  { id: "g5", coverUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", title: "The Matrix", mediaType: "Movie", year: "1999", rating: 8.7, rank: 5 },
  { id: "g6", coverUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", title: "Fight Club", mediaType: "Movie", year: "1999", rating: 8.4, rank: 6 },
  { id: "g7", coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", title: "Dunkirk", mediaType: "Movie", year: "2017", rating: 7.9, rank: 7 },
  { id: "g8", coverUrl: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg", title: "Avengers: Endgame", mediaType: "Movie", year: "2019", rating: 8.3, rank: 8 },
  { id: "g9", coverUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", title: "The Lord of the Rings", mediaType: "Movie", year: "2001", rating: 8.9, rank: 9 },
];

const MOCK_USER_LISTS: ListCardData[] = [
  { id: "l1", title: "Top Sci-Fi Movies", coverUrls: ["https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"] },
  { id: "l2", title: "Horror Marathon", coverUrls: ["https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", null] },
  { id: "l3", title: "Games of the Year", coverUrls: ["https://images.igdb.com/igdb/image/upload/t_cover_big/co5p2d.jpg", "https://images.igdb.com/igdb/image/upload/t_cover_big/co5v3y.jpg", null] },
  { id: "l4", title: "Weekend Watchlist", coverUrls: ["https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg", "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg", "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg"] },
  { id: "l5", title: "Classic Films", coverUrls: ["https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", null, null] },
];

// ── Stub (replace with real check later) ─────────────────

function isOwner(listId: string): boolean {
  return true; // TODO: real ownership check
}

// ── Page Component ───────────────────────────────────────

export default function ViewList() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const [items] = useState<EditableGridItem[]>(MOCK_ITEMS);

  const owner = isOwner(listId ?? "");

  return (
    <div className="flex justify-center p-6">
      <div className="space-y-6">
        <div className="pl-10">
          <ListHeader
            title="Top Sci-Fi Movies"
            description="My personal list of must-watch science fiction films."
            updatedAt="June 3, 2026 at 14:30"
          />
        </div>

        <div className="flex gap-6 items-start">
          <EditableMediaGrid items={items} columns={5} showRank={false} />

          {/* Vertical divider */}
          <div className="self-stretch w-px bg-border shrink-0" />

          {/* Right column: Edit button + User lists */}
          <div className="flex flex-col gap-3 shrink-0 sticky top-24">
            {owner && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/lists/${listId}/edit`)}
              >
                <Pencil size={14} className="mr-1.5" />
                Edit List
              </Button>
            )}
            <UserListsPanel
              username="alice"
              avatarUrl="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=alice"
              showAddFriend
              lists={MOCK_USER_LISTS}
              truncateTitles
              className="h-162.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
