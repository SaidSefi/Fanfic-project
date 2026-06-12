import * as React from "react"

import { cn } from "@/lib/utils"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function roundValueTo(value: number, to: number) {
  const rounded = Math.round(value / to) * to
  const precision = `${to}`.split(".")[1]?.length || 0
  return Number(rounded.toFixed(precision))
}

function DefaultStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-full", className)}
    >
      <path
        fill="currentColor"
        d="M12 2.25l2.96 6 6.62.96-4.79 4.67 1.13 6.59L12 17.36l-5.92 3.11 1.13-6.59-4.79-4.67 6.62-.96L12 2.25z"
      />
    </svg>
  )
}

export type RatingProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> & {
  defaultValue?: number
  value?: number
  onChange?: (value: number) => void
  emptySymbol?: React.ReactNode | ((value: number) => React.ReactNode)
  fullSymbol?: React.ReactNode | ((value: number) => React.ReactNode)
  fractions?: number
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number
  count?: number
  onHover?: (value: number) => void
  getSymbolLabel?: (value: number) => string
  name?: string
  readOnly?: boolean
  allowClear?: boolean
  highlightSelectedOnly?: boolean
  color?: string
}

const sizeClasses = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
}

function getSizeClass(size: RatingProps["size"]) {
  if (typeof size === "number") return undefined
  return sizeClasses[size ?? "sm"]
}

function getSymbol(
  symbol: RatingProps["emptySymbol"] | RatingProps["fullSymbol"],
  value: number,
  fallback: React.ReactNode
) {
  if (typeof symbol === "function") return symbol(value)
  return symbol ?? fallback
}

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      className,
      style,
      defaultValue = 0,
      value,
      onChange,
      emptySymbol,
      fullSymbol,
      fractions = 1,
      size = "sm",
      count = 5,
      onHover,
      getSymbolLabel = (value) => `${value}`,
      name,
      readOnly = false,
      allowClear = false,
      highlightSelectedOnly = false,
      color = "var(--primary)",
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
      onTouchStart,
      onTouchEnd,
      ...props
    },
    ref
  ) => {
    const generatedName = React.useId()
    const generatedId = React.useId()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const [hovered, setHovered] = React.useState(-1)
    const [isOutside, setOutside] = React.useState(true)

    const currentValue = isControlled ? value : internalValue
    const safeFractions = Math.max(1, Math.floor(fractions))
    const safeCount = Math.max(1, Math.floor(count))
    const decimalUnit = 1 / safeFractions
    const stableValueRounded = roundValueTo(currentValue, decimalUnit)
    const finalValue = hovered !== -1 ? hovered : stableValueRounded
    const ratingName = name ?? generatedName

    const setRootRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node

        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    const setValue = React.useCallback(
      (nextValue: number) => {
        if (readOnly) return

        const newValue =
          allowClear && nextValue === stableValueRounded ? 0 : nextValue

        if (!isControlled) {
          setInternalValue(newValue)
        }

        onChange?.(newValue)
      },
      [allowClear, isControlled, onChange, readOnly, stableValueRounded]
    )

    const getRatingFromCoordinates = React.useCallback(
      (x: number) => {
        if (!rootRef.current) return 0

        const { left, right, width } = rootRef.current.getBoundingClientRect()
        const symbolWidth = width / safeCount
        const dir =
          rootRef.current.closest("[dir]")?.getAttribute("dir") ??
          document.documentElement.dir

        const hoverPosition = dir === "rtl" ? right - x : x - left
        const hoverValue = hoverPosition / symbolWidth

        return clamp(
          roundValueTo(hoverValue + decimalUnit / 2, decimalUnit),
          decimalUnit,
          safeCount
        )
      },
      [decimalUnit, safeCount]
    )

    const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
      onMouseEnter?.(event)
      if (!readOnly) setOutside(false)
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(event)

      if (readOnly) return

      const rounded = getRatingFromCoordinates(event.clientX)
      setHovered(rounded)

      if (rounded !== hovered) {
        onHover?.(rounded)
      }
    }

    const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(event)

      if (readOnly) return

      setHovered(-1)
      setOutside(true)

      if (hovered !== -1) {
        onHover?.(-1)
      }
    }

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
      const { touches } = event

      if (touches.length === 1 && !readOnly) {
        setValue(getRatingFromCoordinates(touches[0].clientX))
      }

      onTouchStart?.(event)
    }

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
      event.preventDefault()
      onTouchEnd?.(event)
    }

    const handleBlur = () => {
      if (isOutside) {
        setHovered(-1)
      }
    }

    return (
      <div
        ref={setRootRef}
        role="radiogroup"
        aria-readonly={readOnly || undefined}
        className={cn(
          "inline-flex w-fit items-center gap-0.5",
          readOnly ? "cursor-default" : "cursor-pointer",
          className
        )}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {Array.from({ length: safeCount }, (_, index) => {
          const integerValue = index + 1
          const groupStart = integerValue - 1
          const activeFraction = clamp(finalValue - groupStart, 0, 1)
          const visualFill = highlightSelectedOnly
            ? finalValue > groupStart && finalValue <= integerValue
              ? activeFraction
              : 0
            : activeFraction

          return (
            <div
              key={integerValue}
              className={cn(
                "relative shrink-0",
                getSizeClass(size)
              )}
              style={
                typeof size === "number"
                  ? { width: size, height: size }
                  : undefined
              }
            >
              <div className="absolute inset-0 text-muted-foreground/30">
                {getSymbol(emptySymbol, integerValue, <DefaultStar />)}
              </div>

              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{
                  width: `${visualFill * 100}%`,
                  color,
                }}
              >
                <div
                  className={cn("h-full", getSizeClass(size))}
                  style={
                    typeof size === "number"
                      ? { width: size, height: size }
                      : undefined
                  }
                >
                  {getSymbol(fullSymbol, integerValue, <DefaultStar />)}
                </div>
              </div>

              {!readOnly && (
                <div className="absolute inset-0 flex">
                  {Array.from(
                    {
                      length:
                        index === 0 ? safeFractions + 1 : safeFractions,
                    },
                    (_, fractionIndex) => {
                      const fractionValue =
                        decimalUnit *
                        (index === 0 ? fractionIndex : fractionIndex + 1)
                      const symbolValue = roundValueTo(
                        integerValue - 1 + fractionValue,
                        decimalUnit
                      )
                      const checked = symbolValue === stableValueRounded

                      return (
                        <label
                          key={`${integerValue}-${symbolValue}`}
                          className="h-full flex-1 cursor-pointer"
                          title={getSymbolLabel(symbolValue)}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            name={ratingName}
                            value={symbolValue}
                            checked={checked}
                            aria-label={getSymbolLabel(symbolValue)}
                            onChange={() => setValue(symbolValue)}
                            onFocus={() => setHovered(symbolValue)}
                            onBlur={handleBlur}
                          />
                        </label>
                      )
                    }
                  )}
                </div>
              )}

              {readOnly && (
                <span className="sr-only">
                  {getSymbolLabel(stableValueRounded)}
                </span>
              )}
            </div>
          )
        })}

        {!readOnly && stableValueRounded === 0 && (
          <input
            id={`${generatedId}-empty`}
            type="radio"
            className="sr-only"
            name={ratingName}
            value={0}
            checked
            readOnly
            aria-label="0"
          />
        )}
      </div>
    )
  }
)

Rating.displayName = "Rating"