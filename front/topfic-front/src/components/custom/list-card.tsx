import { cn } from "@/lib/utils";

export interface ListCardProps {
  /** List title */
  title: string;
  /** Cover URLs for the first 3 items (can be null) */
  coverUrls: (string | null)[];
  /** When true, title is single-line with ellipsis (default: false, wraps) */
  truncate?: boolean;
  /** Called when the card is clicked */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
}

export function ListCard({ title, coverUrls, truncate: shouldTruncate = false, onClick, className }: ListCardProps) {
  const [first, second, third] = coverUrls;

  return (
    <div
      className={cn(className)}
      onClick={onClick}
    >
      {/* Cover preview — 3-section grid layout */}
      <div
        className={cn(
          "aspect-square rounded-lg overflow-hidden bg-muted shadow-sm grid grid-cols-2 gap-px transition-all duration-200",
          onClick && "cursor-pointer hover:ring-2 hover:ring-primary/50",
        )}
      >
        {/* Left: full height */}
        <div className="min-h-0">
          {first ? (
            <img src={first} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground/50">?</div>
          )}
        </div>

        {/* Right column: 60/40 split */}
        <div className="min-h-0 flex flex-col">
          {/* Top right: 60% */}
          <div className="overflow-hidden" style={{ flex: "0 0 60%" }}>
            {second ? (
              <img src={second} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg text-muted-foreground/50">?</div>
            )}
          </div>
          {/* Bottom right: 40% */}
          <div className="overflow-hidden" style={{ flex: "0 0 40%" }}>
            {third ? (
              <img src={third} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg text-muted-foreground/50">?</div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <p className={cn(
        "mt-2 text-sm font-medium leading-tight text-center",
        shouldTruncate && "truncate",
      )}>
        {title}
      </p>
    </div>
  );
}
