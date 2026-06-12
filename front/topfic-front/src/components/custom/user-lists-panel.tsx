import { Button } from "@/components/ui/button";
import { ListCard } from "./list-card";
import { cn } from "@/lib/utils";

export interface ListCardData {
  id: string;
  title: string;
  coverUrls: (string | null)[];
}

export interface UserListsPanelProps {
  /** Username of the list owner */
  username: string;
  /** Avatar URL */
  avatarUrl: string | null;
  /** Whether to show the add friend button */
  showAddFriend?: boolean;
  /** Text for the add friend button */
  addFriendLabel?: string;
  /** Called when add friend is clicked */
  onAddFriend?: () => void;
  /** Lists to display */
  lists: ListCardData[];
  /** When true, list titles truncate with ellipsis (default: false, wraps) */
  truncateTitles?: boolean;
  /** Called when a list card is clicked */
  onListClick?: (listId: string) => void;
  /** Custom class name */
  className?: string;
}

export function UserListsPanel({
  username,
  avatarUrl,
  showAddFriend = false,
  addFriendLabel = "Add Friend",
  onAddFriend,
  lists,
  truncateTitles = false,
  onListClick,
  className,
}: UserListsPanelProps) {
  return (
    <div className={cn("flex flex-col w-64", className)}>
      {/* User header */}
      <div className="flex items-start gap-3 p-3">
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-10 w-10 rounded-full object-cover border shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0 border">
            {username.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name + button */}
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold truncate">@{username}</p>
          {showAddFriend && (
            <Button
              size="xs"
              className="mt-1.5"
              onClick={onAddFriend}
            >
              {addFriendLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Dashed separator */}
      <div className="border-t border-dashed mx-3" />

      {/* Lists */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-border
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
      >
        {lists.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No lists yet
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              title={list.title}
              coverUrls={list.coverUrls}
              truncate={truncateTitles}
              onClick={() => onListClick?.(list.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
