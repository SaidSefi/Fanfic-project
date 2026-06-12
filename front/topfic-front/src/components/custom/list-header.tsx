import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface ListHeaderProps {
  /** List title */
  title: string;
  /** List description */
  description?: string | null;
  /** Last update timestamp (ISO string or formatted text) */
  updatedAt?: string | null;
  /** Called when the title changes */
  onTitleChange?: (value: string) => void;
  /** Called when the description changes */
  onDescriptionChange?: (value: string) => void;
  /** Custom class name */
  className?: string;
}

export function ListHeader({
  title,
  description,
  updatedAt,
  onTitleChange,
  onDescriptionChange,
  className,
}: ListHeaderProps) {
  const isEditing = !!onTitleChange || !!onDescriptionChange;

  return (
    <div className={className}>
      {/* Title */}
      {isEditing && onTitleChange ? (
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-2xl md:text-3xl font-bold tracking-tight h-auto py-1.5 px-3 -mx-3 rounded-lg border border-dashed border-border bg-muted/30 shadow-none focus-visible:border-primary focus-visible:border-solid focus-visible:bg-background focus-visible:ring-0 transition-colors"
          placeholder="List title"
        />
      ) : (
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {title}
        </h1>
      )}

      {/* Description */}
      {isEditing && onDescriptionChange ? (
        <Textarea
          value={description ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl py-2 px-3 -mx-3 rounded-lg border border-dashed border-border bg-muted/30 shadow-none resize-y focus-visible:border-primary focus-visible:border-solid focus-visible:bg-background focus-visible:ring-0 transition-colors"
          placeholder="List description"
          rows={2}
        />
      ) : (
        description && (
          <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
            {description}
          </p>
        )
      )}

      {/* Last updated */}
      {updatedAt && (
        <p className="mt-4 text-xs text-muted-foreground/60 font-mono">
          Last updated: {updatedAt}
        </p>
      )}
    </div>
  );
}
