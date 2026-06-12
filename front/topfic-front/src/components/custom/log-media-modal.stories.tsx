import type { Meta, StoryObj } from "@storybook/react-vite";
import { LogMediaModal } from "./log-media-modal";

const meta: Meta<typeof LogMediaModal> = {
  title: "Custom/LogMediaModal",
  component: LogMediaModal,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    onStatusChange: { action: "status changed" },
    onConsumedDateChange: { action: "date changed" },
    onRatingChange: { action: "rating changed" },
    onLikeChange: { action: "like toggled" },
    onReviewChange: { action: "review changed" },
    onSave: { action: "saved" },
    onClose: { action: "closed" },
  },
};

export default meta;
type Story = StoryObj<typeof LogMediaModal>;

// ── Stories ──────────────────────────────────────────────

export const Default: Story = {
  args: {
    title: "Inception",
    releaseDate: "2010-07-16",
    mediaType: "Movie",
    coverUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    status: "Wishlist",
    rating: 0,
    liked: false,
    review: "",
  },
  name: "Default — Wishlist, no rating",
};

export const Consuming: Story = {
  args: {
    title: "The Dark Knight",
    releaseDate: "2008-07-18",
    mediaType: "Movie",
    coverUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    status: "Consuming",
    rating: 4,
    consumedDate: new Date("2026-06-01"),
    liked: true,
    review: "Absolutely incredible. Heath Ledger's performance is unmatched.",
  },
  name: "Consuming — rated, liked, with review",
};

export const Completed: Story = {
  args: {
    title: "Interstellar",
    releaseDate: "2014-11-07",
    mediaType: "Movie",
    coverUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    status: "Completed",
    consumedDate: new Date("2026-05-15"),
    rating: 5,
    liked: true,
    review: "A breathtaking journey through space and time. Hans Zimmer's score is phenomenal.",
  },
  name: "Completed — full data",
};

export const Dropped: Story = {
  args: {
    title: "Cyberpunk 2077",
    releaseDate: "2020-12-10",
    mediaType: "Game",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5p2d.jpg",
    status: "Dropped",
    rating: 2,
    liked: false,
  },
  name: "Dropped — game, no review",
};

export const NoCover: Story = {
  args: {
    title: "Untitled Project",
    releaseDate: null,
    mediaType: "Series",
    coverUrl: null,
    status: "Wishlist",
  },
  name: "No cover — placeholder",
};

export const NoReleaseDate: Story = {
  args: {
    title: "Classic Film",
    mediaType: "Movie",
    coverUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    status: "Completed",
    rating: 4,
  },
  name: "No release date",
};

export const Saving: Story = {
  args: {
    title: "The Matrix",
    releaseDate: "1999-03-31",
    mediaType: "Movie",
    coverUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    status: "Completed",
    rating: 5,
    liked: true,
    review: "A groundbreaking sci-fi classic.",
    saving: true,
  },
  name: "Saving state",
};
