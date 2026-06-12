import { BarChart, Bar, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface RatingDistributionProps {
  /**
   * Record of rating value to count.
   * Keys are the star ratings (e.g. 0, 0.5, 1, …, 5).
   * A missing key is treated as a count of 0.
   */
  distribution: Record<number, number>
  /**
   * Maximum height of the chart in pixels.
   * @default 160
   */
  maxHeight?: number
  /** Custom class name */
  className?: string
}

const chartConfig = {
  count: {
    label: "Ratings",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function RatingDistribution({
  distribution,
  maxHeight = 160,
  className,
}: RatingDistributionProps) {
  const ratings = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

  const data = ratings.map((r) => ({
    rating: `${r} ★`,
    count: distribution[r] ?? 0,
  }))

  const total = data.reduce((sum, d) => sum + d.count, 0)

  const weightedSum = ratings.reduce(
    (sum, r) => sum + r * (distribution[r] ?? 0),
    0,
  )
  const average = total > 0 ? weightedSum / total : 0

  return (
    <div className={className}>
      <ChartContainer config={chartConfig} style={{ height: maxHeight }} className="w-full">
      <BarChart
          data={data}
          barCategoryGap={2}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="rating"
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "oklch(0.552 0.016 285.938)" }}
            interval={0}
          />
          <YAxis
            type="number"
            hide
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => {
                  const pct = total > 0 ? ((Number(value) ?? 0) / total) * 100 : 0
                  return (
                    <span className="tabular-nums">
                      {Number(value).toLocaleString()}
                      <span className="ml-1 text-muted-foreground/70">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  )
                }}
              />
            }
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ChartContainer>

      {/* Average + Total ratings */}
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Average rating</span>
          <span className="font-medium text-foreground tabular-nums">
            {total > 0 ? average.toFixed(1) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Total ratings</span>
          <span className="font-medium text-foreground tabular-nums">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
