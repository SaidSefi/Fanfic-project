import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RatingDistribution } from "@/components/custom/rating-distribution";
import { MediaStatsSummary } from "@/components/custom/media-stats-summary";
import { RelatedMedia, type RelatedMediaGroup } from "@/components/custom/related-media";
import { LogMediaModal } from "@/components/custom/log-media-modal";
import { getMedia, getRelatedMedia, saveUserMedia, getUserMedia } from "@/lib/media/api";
import { useAuth } from "@/lib/auth/AuthContext";
import type { MediaDetail as MediaDetailType, RelatedMedia as RelatedMediaType } from "@/lib/media/types";

export default function MediaDetail() {
  const { mediaId } = useParams<{ mediaId: string }>();
  const { user } = useAuth();

  const [media, setMedia] = useState<MediaDetailType | null>(null);
  const [related, setRelated] = useState<RelatedMediaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  // Existing user media data for pre-filling the modal
  const [userMedia, setUserMedia] = useState<{
    status: string | null;
    rating: number;
    liked: boolean;
    review_text: string;
    consumed_at: string | null;
  } | null>(null);

  useEffect(() => {
    if (!mediaId) return;
    setLoading(true);
    Promise.all([
      getMedia(mediaId),
      getRelatedMedia(mediaId),
    ]).then(([m, r]) => {
      setMedia(m);
      setRelated(r);
    }).catch(() => {
      setMedia(null);
    }).finally(() => setLoading(false));
  }, [mediaId]);

  const handleOpenLogModal = async () => {
    if (!user || !mediaId) {
      setShowLogModal(true);
      return;
    }
    // Load existing user media to pre-fill
    try {
      const um = await getUserMedia(user.id, mediaId);
      setUserMedia(um ? {
        status: um.status ?? null,
        rating: um.rating ?? 0,
        liked: um.liked ?? false,
        review_text: um.review_text ?? "",
        consumed_at: um.consumed_at ?? null,
      } : { status: null, rating: 0, liked: false, review_text: "", consumed_at: null });
    } catch {
      setUserMedia({ status: null, rating: 0, liked: false, review_text: "", consumed_at: null });
    }
    setShowLogModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Media not found.
      </div>
    );
  }

  const year = media.release_date
    ? new Date(media.release_date).getFullYear()
    : null;

  // Group related media by relation_type (Prequel, Sequel, etc.)
  const groups: RelatedMediaGroup[] = (() => {
    const map = new Map<string, RelatedMediaType[]>();
    for (const item of related) {
      const key = item.relation_type || "Related";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([type, items]) => ({
      type,
      items: items.map((i) => ({
        id: i.id,
        title: i.nom,
        coverUrl: i.cover,
        mediaType: i.type ?? "Unknown",
        year: i.year,
      })),
    }));
  })();

  // Rating distribution for the chart
  const ratingDist: Record<number, number> = {};
  if (media.rating_distribution) {
    for (const [key, count] of Object.entries(media.rating_distribution)) {
      ratingDist[Number(key)] = count;
    }
  }

  return (
    <div>
      {/* Banner / Hero */}
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden">
        {(media.banner || media.cover) ? (
          <img
            src={media.banner || media.cover!}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-r from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 -mt-32 relative z-10">
        {/* Poster + Info row */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Left column — poster + button */}
          <div className="shrink-0 flex flex-col items-center gap-4 mx-auto md:mx-0">
            {media.cover ? (
              <img
                src={media.cover}
                alt={media.titre}
                className="w-44 md:w-56 rounded-xl shadow-2xl border-2 border-background"
              />
            ) : (
              <div className="w-44 md:w-56 aspect-2/3 rounded-xl bg-muted flex items-center justify-center text-4xl text-muted-foreground border-2 border-background shadow-2xl">
                ?
              </div>
            )}

            {/* Log / Review button — under the poster */}
            <Button onClick={handleOpenLogModal} size="sm">
              Log / Review
            </Button>
          </div>

          {/* Right column — all vertical content */}
          <div className="flex-1 min-w-0 pt-4 md:pt-16">
            {/* Title + meta */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold">{media.titre}</h1>

              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground">
                {media.type && (
                  <Badge variant="secondary">{media.type}</Badge>
                )}
                {year && <span>{year}</span>}
              </div>
            </div>

            {/* Description */}
            {media.synopsis && (
              <p className="mt-6 text-muted-foreground leading-relaxed">
                {media.synopsis}
              </p>
            )}

            {/* ── Separator ── */}
            <Separator className="my-8" />

            {/* Ratings (1/4) + Stats (3/4) row */}
            <div className="flex flex-col md:flex-row md:items-stretch gap-0">
              <div className="md:flex-1">
                <RatingDistribution distribution={ratingDist} />
              </div>
              <Separator
                orientation="vertical"
                className="mx-6 hidden md:block self-stretch"
              />
              <Separator className="my-6 md:hidden" />
              <div className="md:flex-3">
                <MediaStatsSummary
                  wishlist={media.stats?.wishlist ?? 0}
                  consuming={media.stats?.consuming ?? 0}
                  completed={media.stats?.completed ?? 0}
                  dropped={media.stats?.dropped ?? 0}
                  likes={media.stats?.likes ?? 0}
                  reviews={media.stats?.reviews ?? 0}
                />
              </div>
            </div>

            {/* ── Separator ── */}
            {groups.length > 0 && (
              <>
                <Separator className="my-8" />
                <div className="pb-8">
                  <RelatedMedia groups={groups} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Log Media Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <LogMediaModal
            title={media.titre}
            releaseDate={media.release_date}
            mediaType={media.type ?? "Unknown"}
            coverUrl={media.cover}
            status={userMedia?.status ?? null}
            rating={userMedia?.rating ?? 0}
            liked={userMedia?.liked ?? false}
            review={userMedia?.review_text ?? ""}
            consumedDate={userMedia?.consumed_at ? new Date(userMedia.consumed_at) : null}
            onClose={() => setShowLogModal(false)}
            onSave={async (payload) => {
              if (!user || !mediaId) return;
              try {
                await saveUserMedia(user.id, mediaId, payload);
              } catch {
                // silently fail for now
              }
              setShowLogModal(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
