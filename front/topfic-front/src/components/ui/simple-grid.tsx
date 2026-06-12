import * as React from "react"

import { cn } from "@/lib/utils"

type Breakpoint = "base" | "xs" | "sm" | "md" | "lg" | "xl"

type ResponsiveValue<T> =
  | T
  | Partial<Record<Breakpoint, T>>

type SimpleGridSpacing =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | number
  | string

export type SimpleGridProps = React.HTMLAttributes<HTMLDivElement> & {
  cols?: ResponsiveValue<number>
  spacing?: ResponsiveValue<SimpleGridSpacing>
  verticalSpacing?: ResponsiveValue<SimpleGridSpacing>
  minColWidth?: string | number
  autoFlow?: "auto-fit" | "auto-fill"
  autoRows?: string
}

const breakpointValues: Record<Exclude<Breakpoint, "base">, number> = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

const spacingValues: Record<string, string> = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
}

function toCssSize(value: SimpleGridSpacing | undefined) {
  if (value === undefined) return undefined
  if (typeof value === "number") return `${value}px`
  return spacingValues[value] ?? value
}

function getResponsiveValue<T>(
  value: ResponsiveValue<T> | undefined,
  fallback: T
) {
  if (value === undefined) return { base: fallback }

  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Partial<Record<Breakpoint, T>>
  }

  return { base: value as T }
}

function buildMediaStyles(
  className: string,
  cols: ResponsiveValue<number>,
  spacing: ResponsiveValue<SimpleGridSpacing>,
  verticalSpacing: ResponsiveValue<SimpleGridSpacing> | undefined,
  autoRows: string | undefined
) {
  const colsValues = getResponsiveValue(cols, 1)
  const spacingValues = getResponsiveValue(spacing, "md")
  const verticalSpacingValues = getResponsiveValue(
    verticalSpacing,
    spacingValues.base ?? "md"
  )

  const baseCols = colsValues.base ?? 1
  const baseSpacing = toCssSize(spacingValues.base ?? "md")
  const baseVerticalSpacing = toCssSize(
    verticalSpacingValues.base ?? spacingValues.base ?? "md"
  )

  let css = `
.${className} {
  display: grid;
  grid-template-columns: repeat(${baseCols}, minmax(0, 1fr));
  gap: ${baseVerticalSpacing} ${baseSpacing};
  ${autoRows ? `grid-auto-rows: ${autoRows};` : ""}
}
`

  ;(["xs", "sm", "md", "lg", "xl"] as const).forEach((breakpoint) => {
    const rules: string[] = []

    if (colsValues[breakpoint] !== undefined) {
      rules.push(
        `grid-template-columns: repeat(${colsValues[breakpoint]}, minmax(0, 1fr));`
      )
    }

    const horizontalGap = spacingValues[breakpoint]
    const verticalGap =
      verticalSpacingValues[breakpoint] ?? horizontalGap

    if (horizontalGap !== undefined || verticalGap !== undefined) {
      rules.push(
        `gap: ${toCssSize(verticalGap ?? spacingValues.base ?? "md")} ${toCssSize(
          horizontalGap ?? spacingValues.base ?? "md"
        )};`
      )
    }

    if (rules.length > 0) {
      css += `
@media (min-width: ${breakpointValues[breakpoint]}px) {
  .${className} {
    ${rules.join("\n")}
  }
}
`
    }
  })

  return css
}

function normalizeCssSize(value: string | number) {
  return typeof value === "number" ? `${value}px` : value
}

export const SimpleGrid = React.forwardRef<HTMLDivElement, SimpleGridProps>(
  (
    {
      className,
      children,
      cols = 1,
      spacing = "md",
      verticalSpacing,
      minColWidth,
      autoFlow = "auto-fill",
      autoRows,
      style,
      ...props
    },
    ref
  ) => {
    const id = React.useId()
    const generatedClassName = `simple-grid-${id.replace(/:/g, "")}`

    const css = React.useMemo(() => {
      if (minColWidth !== undefined) return ""

      return buildMediaStyles(
        generatedClassName,
        cols,
        spacing,
        verticalSpacing,
        autoRows
      )
    }, [generatedClassName, cols, spacing, verticalSpacing, autoRows, minColWidth])

    const inlineStyle: React.CSSProperties | undefined =
      minColWidth !== undefined
        ? {
            display: "grid",
            gridTemplateColumns: `repeat(${autoFlow}, minmax(min(${normalizeCssSize(
              minColWidth
            )}, 100%), 1fr))`,
            columnGap: toCssSize(
              typeof spacing === "object" && spacing !== null
                ? spacing.base ?? "md"
                : spacing
            ),
            rowGap: toCssSize(
              typeof verticalSpacing === "object" && verticalSpacing !== null
                ? verticalSpacing.base ??
                    (typeof spacing === "object" && spacing !== null
                      ? spacing.base ?? "md"
                      : spacing)
                : verticalSpacing ??
                    (typeof spacing === "object" && spacing !== null
                      ? spacing.base ?? "md"
                      : spacing)
            ),
            gridAutoRows: autoRows,
            ...style,
          }
        : style

    return (
      <>
        {!minColWidth && <style>{css}</style>}

        <div
          ref={ref}
          className={cn(generatedClassName, className)}
          style={inlineStyle}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)

SimpleGrid.displayName = "SimpleGrid"