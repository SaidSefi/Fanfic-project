import type { Meta, StoryObj } from "@storybook/react-vite";
import { Rating } from "./rating";

const meta: Meta<typeof Rating> = {
  title: "UI/Rating",
  component: Rating,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    value: { control: { type: "number", min: 0, max: 5, step: 0.1 } },
    count: { control: { type: "number", min: 1, max: 10 } },
    size: {
      control: { type: "select" },
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    readOnly: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Rating>;

// ── Size Variants (read-only, display mode) ────────────

export const ExtraSmall: Story = {
  args: { value: 4.2, size: "xs", readOnly: true },
  name: "XS — Extra Small",
};

export const Small: Story = {
  args: { value: 4.2, size: "sm", readOnly: true },
  name: "SM — Small (default)",
};

export const Medium: Story = {
  args: { value: 4.2, size: "md", readOnly: true },
  name: "MD — Medium",
};

export const Large: Story = {
  args: { value: 4.2, size: "lg", readOnly: true },
  name: "LG — Large",
};

export const ExtraLarge: Story = {
  args: { value: 4.2, size: "xl", readOnly: true },
  name: "XL — Extra Large",
};

// ── All Sizes Side-by-Side ──────────────────────────────

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
        <div key={s} className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-8 font-mono">{s.toUpperCase()}</span>
          <Rating value={4.2} size={s} readOnly />
          <span className="text-xs text-muted-foreground">4.2 / 5</span>
        </div>
      ))}
    </div>
  ),
};

// ── Value Variants ──────────────────────────────────────

export const FullStars: Story = {
  args: { value: 5, size: "md", readOnly: true },
  name: "Full — 5/5",
};

export const HalfStar: Story = {
  args: { value: 3.5, size: "md", readOnly: true },
  name: "Half — 3.5/5",
};

export const QuarterStar: Story = {
  args: { value: 2.3, size: "md", readOnly: true },
  name: "Partial — 2.3/5",
};

export const EmptyStars: Story = {
  args: { value: 0, size: "md", readOnly: true },
  name: "Empty — 0/5",
};

export const LowRating: Story = {
  args: { value: 1.2, size: "md", readOnly: true },
  name: "Low — 1.2/5",
};

// ── Interactive (editable) ──────────────────────────────

export const Interactive: Story = {
  args: { value: 3, size: "lg" },
  name: "Interactive — Click to rate",
};

export const InteractiveSmall: Story = {
  args: { value: 4, size: "sm" },
  name: "Interactive — Small",
};

// ── 10-scale (TMDB/IGDB) mapped to 5 stars ─────────────

export const TenScale: Story = {
  args: { value: 4.2, size: "md", readOnly: true },
  name: "10-scale — 8.4/10 → 4.2/5",
};

export const TenScaleHalf: Story = {
  args: { value: 3.75, size: "md", readOnly: true },
  name: "10-scale — 7.5/10 → 3.75/5",
};
