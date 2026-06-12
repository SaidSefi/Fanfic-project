import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListCard } from "./list-card";

const meta: Meta<typeof ListCard> = {
  title: "Custom/ListCard",
  component: ListCard,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof ListCard>;

// ── Stories ──────────────────────────────────────────────

export const Default: Story = {
  args: {
    title: "Top Sci-Fi Movies",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    ],
    className: "w-48",
  },
  name: "Default — 3 covers",
};

export const TwoCovers: Story = {
  args: {
    title: "Horror Marathon",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
      "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      null,
    ],
    className: "w-48",
  },
  name: "Two covers — one missing",
};

export const OneCover: Story = {
  args: {
    title: "Favorites",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      null,
      null,
    ],
    className: "w-48",
  },
  name: "One cover — two missing",
};

export const NoCovers: Story = {
  args: {
    title: "Empty List",
    coverUrls: [null, null, null],
    className: "w-48",
  },
  name: "No covers — all placeholders",
};

export const LargeSize: Story = {
  args: {
    title: "Weekend Watchlist",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg",
      "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    ],
    className: "w-56",
  },
  name: "Large — 224px",
};

export const SmallSize: Story = {
  args: {
    title: "Quick Picks",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    ],
    className: "w-36",
  },
  name: "Small — 144px",
};

export const LongTitle: Story = {
  args: {
    title: "The Definitive Collection of All-Time Cinematic Masterpieces",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
    ],
    className: "w-48",
  },
  name: "Long title — wrapped (default)",
};

export const LongTitleTruncated: Story = {
  args: {
    title: "The Definitive Collection of All-Time Cinematic Masterpieces",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
    ],
    truncate: true,
    className: "w-48",
  },
  name: "Long title — truncated with ellipsis",
};
