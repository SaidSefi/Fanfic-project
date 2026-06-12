import type { Meta, StoryObj } from "@storybook/react-vite"
import { ListMediaItem } from "./list-media-item"
import type { ListMediaItemProps } from "./list-media-item"

const meta: Meta<typeof ListMediaItem> = {
  title: "Custom/ListMediaItem",
  component: ListMediaItem,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onRankChange: { action: "rank changed" },
    onReviewClick: { action: "review clicked" },
    onDelete: { action: "delete clicked" },
    onTitleClick: { action: "title clicked" },
  },
}

export default meta
type Story = StoryObj<typeof ListMediaItem>

const baseArgs: ListMediaItemProps = {
  coverUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911B5MrVMVWVGWC.jpg",
  title: "Inception",
  mediaType: "Movie",
  year: "2010",
  rating: 8.4,
  rank: 1,
  review: "A mind-bending masterpiece that keeps you on the edge of your seat.",
}

// ── Default ─────────────────────────────────────────────
export const Default: Story = {
  args: { ...baseArgs },
}

// ── No Review ───────────────────────────────────────────
export const NoReview: Story = {
  args: {
    ...baseArgs,
    review: null,
    title: "The Dark Knight",
    year: "2008",
    rating: 9.0,
    rank: 2,
  },
}

// ── No Rating ───────────────────────────────────────────
export const NoRating: Story = {
  args: {
    ...baseArgs,
    rating: null,
    title: "Untitled Project",
    year: "2025",
    rank: 3,
  },
}

// ── No Year ─────────────────────────────────────────────
export const NoYear: Story = {
  args: {
    ...baseArgs,
    year: null,
    title: "Classic Film",
    rank: 4,
  },
}

// ── Minimal (only required fields) ─────────────────────
export const Minimal: Story = {
  args: {
    coverUrl: null,
    title: "Unknown Media",
    mediaType: "Game",
    rank: 5,
    review: null,
    rating: null,
    year: null,
  },
}

// ── Game type ──────────────────────────────────────────
export const GameItem: Story = {
  args: {
    coverUrl:
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co5p2d.jpg",
    title: "The Legend of Zelda",
    mediaType: "Game",
    year: "2017",
    rating: 9.7,
    rank: 1,
    review: "An absolute masterpiece of open-world design and exploration.",
  },
}

// ── Long title ──────────────────────────────────────────
export const LongTitle: Story = {
  args: {
    ...baseArgs,
    title: "Call Of Duty",
    rank: 7,
    coverUrl:
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co2n19.jpg",
    mediaType: "Game",
    year: "2003",
  },
}

// ── Missing cover image ────────────────────────────────
export const MissingCover: Story = {
  args: {
    ...baseArgs,
    coverUrl: null,
    title: "Placeholder Media",
    rank: 10,
  },
}

// ── High rank number ───────────────────────────────────
export const HighRank: Story = {
  args: {
    ...baseArgs,
    rank: 42,
    title: "Item #42",
    review: null,
  },
}

// ── Rating 0 ────────────────────────────────────────────
export const ZeroRating: Story = {
  args: {
    ...baseArgs,
    rating: 0,
    title: "Rated Zero",
    review: null,
    rank: 8,
  },
}

// ── Long review ─────────────────────────────────────────
export const LongReview: Story = {
  args: {
    ...baseArgs,
    title: "Interstellar",
    year: "2014",
    rating: 8.7,
    rank: 3,
    review:
      "A breathtaking journey through space and time that explores the depths of human emotion and the power of love across dimensions. Christopher Nolan delivers yet another stunning visual and emotional experience. The soundtrack by Hans Zimmer is absolutely phenomenal and the science behind the story is grounded in real theoretical physics.",
  },
}

// ── Short review ────────────────────────────────────────
export const ShortReview: Story = {
  args: {
    ...baseArgs,
    title: "Dunkirk",
    year: "2017",
    rating: 7.9,
    rank: 5,
    review: "Intense.",
  },
}

// ── No cover, no rating, no year — edge case ────────────
export const BareMinimum: Story = {
  args: {
    coverUrl: null,
    title: "Bare Minimum Item",
    mediaType: "Series",
    rank: 99,
    review: null,
    rating: null,
    year: null,
  },
}
