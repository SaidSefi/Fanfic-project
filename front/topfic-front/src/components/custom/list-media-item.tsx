import { useState, useRef, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ListMediaItemProps {
  /** URL of the cover image */
  coverUrl: string | null;
  /** Media title */
  title: string;
  /** Media type label (Movie, Game, etc.) */
  mediaType: string;
  /** Release year */
  year?: string | null;
  /** Average rating (0-10) */
  rating?: number | null;
  /** Position in the list (1-based) */
  rank: number;
  /** Review text — if provided, review button is shown */
  review?: string | null;
  /** Whether to show the rank number (default true) */
  showRank?: boolean;
  /** Called when the user finishes editing the rank */
  onRankChange?: (newRank: number) => void;
  /** Called when the review button is clicked */
  onReviewClick?: () => void;
  /** Called when the delete button is clicked */
  onDelete?: () => void;
  /** Called when the title is clicked */
  onTitleClick?: () => void;
}

export function ListMediaItem({
  coverUrl,
  title,
  mediaType,
  year,
  rating,
  rank,
  review,
  showRank = true,
  onRankChange,
  onReviewClick,
  onDelete,
  onTitleClick,
}: ListMediaItemProps) {
  const [editingRank, setEditingRank] = useState(false);
  const [rankValue, setRankValue] = useState(String(rank));
  const [showReviewModal, setShowReviewModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync rank prop when it changes externally
  useEffect(() => {
    setRankValue(String(rank));
  }, [rank]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingRank && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingRank]);

  const commitRank = () => {
    const parsed = parseInt(rankValue, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed !== rank) {
      onRankChange?.(parsed);
    } else {
      setRankValue(String(rank));
    }
    setEditingRank(false);
  };

  const handleRankKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitRank();
    } else if (e.key === "Escape") {
      setRankValue(String(rank));
      setEditingRank(false);
    }
  };

  return (
    <div className="group relative w-full max-w-45">
        {/* Cover image */}
        <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-muted shadow-sm">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground/50">
              ?
            </div>
          )}

          {/* Review button — top right (only if review exists) */}
          {review && (
            <button
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center hover:scale-125 transition-all duration-200 z-10"
              onClick={(e) => {
                e.stopPropagation()
                setShowReviewModal(true)
                onReviewClick?.()
              }}
              aria-label="View review"
              title="View review"
            >
              <MessageSquare size={15} />
            </button>
          )}

          {/* Delete button — center, appears on hover */}
          {onDelete && (
            <button
              className="absolute inset-0 m-auto h-9 w-9 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-red-600 hover:shadow-xl"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Remove item"
              title="Remove item"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Rank — bottom center, click to edit */}
          {showRank && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            {editingRank ? (
              <input
                ref={inputRef}
                type="number"
                min={1}
                value={rankValue}
                onChange={(e) => setRankValue(e.target.value)}
                onBlur={commitRank}
                onKeyDown={handleRankKeyDown}
                className="h-7 w-12 rounded-md border border-input bg-background text-center text-sm font-bold shadow-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              />
            ) : (
              <button
                className="h-7 min-w-8 px-2 rounded-md bg-background/80 text-foreground backdrop-blur-sm text-sm font-bold hover:bg-background/90 transition-colors"
                onClick={() => setEditingRank(true)}
                title="Click to change position"
              >
                {rank}
              </button>
            )}
          </div>
          )}
        </div>

        {/* Media type badge — between image and title */}
        <div className="flex justify-center mt-1.5">
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wide px-1.5 py-0">
            {mediaType}
          </Badge>
        </div>

        {/* Info below the image — centered */}
        <div className="mt-2 space-y-0.5 text-center">
          {/* Title */}
          <p
            className={cn(
              "text-sm font-medium leading-tight truncate group-hover:text-primary transition-colors",
              onTitleClick && "cursor-pointer"
            )}
            onClick={onTitleClick}
          >
            {title}
          </p>

          {/* Year */}
          {year && (
            <p className="text-xs text-muted-foreground">{year}</p>
          )}

          {/* Rating — always renders for alignment, invisible when no rating */}
          <div className={cn("flex justify-center", (!rating || rating <= 0) && "invisible")}>
            <Rating value={(rating ?? 0) / 2} count={5} size="xs" readOnly />
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowReviewModal(false)}
          >
            <div
              className="w-full max-w-md rounded-xl border bg-card shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Review</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review}
              </p>
            </div>
          </div>
        )}
      </div>
  );
}
