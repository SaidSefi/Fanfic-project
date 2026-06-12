import { Bookmark, Play, CheckCircle, XCircle, Heart, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MediaStatsSummaryProps {
  wishlist?: number
  consuming?: number
  completed?: number
  dropped?: number
  likes?: number
  reviews?: number
  className?: string
}

interface StatCellProps {
  icon: React.ReactNode
  label: string
  value: number
  colorClass: string
}

function StatCell({ icon, label, value, colorClass }: StatCellProps) {
  return (
    <div className="flex flex-col rounded-xl border px-3.5 py-3">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="mt-1 flex items-center justify-between">
        <span className="mr-3 text-xl font-bold tabular-nums leading-none">
          {value.toLocaleString()}
        </span>
        <div className={cn("shrink-0", colorClass)}>{icon}</div>
      </div>
    </div>
  )
}

export function MediaStatsSummary({
  wishlist = 0,
  consuming = 0,
  completed = 0,
  dropped = 0,
  likes = 0,
  reviews = 0,
  className,
}: MediaStatsSummaryProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Status row — 4 cells */}
      <div className="grid grid-cols-4 gap-2">
        <StatCell
          icon={<Bookmark size={20} strokeWidth={1.75} />}
          label="Wishlist"
          value={wishlist}
          colorClass="text-blue-500"
        />
        <StatCell
          icon={<Play size={20} strokeWidth={1.75} />}
          label="Consuming"
          value={consuming}
          colorClass="text-amber-500"
        />
        <StatCell
          icon={<CheckCircle size={20} strokeWidth={1.75} />}
          label="Completed"
          value={completed}
          colorClass="text-emerald-500"
        />
        <StatCell
          icon={<XCircle size={20} strokeWidth={1.75} />}
          label="Dropped"
          value={dropped}
          colorClass="text-purple-500"
        />
      </div>

      {/* Engagement row — 2 cells */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <StatCell
          icon={<Heart size={20} strokeWidth={1.75} />}
          label="Likes"
          value={likes}
          colorClass="text-red-500"
        />
        <StatCell
          icon={<MessageSquare size={20} strokeWidth={1.75} />}
          label="Reviews"
          value={reviews}
          colorClass="text-primary"
        />
      </div>
    </div>
  )
}
