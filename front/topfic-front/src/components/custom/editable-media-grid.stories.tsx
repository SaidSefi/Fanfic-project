import type { Meta, StoryObj } from "@storybook/react-vite";
import { DndContext } from "@dnd-kit/core";
import { EditableMediaGrid } from "./editable-media-grid";
import type { EditableGridItem } from "./editable-media-grid";

const meta: Meta<typeof EditableMediaGrid> = {
  title: "Custom/EditableMediaGrid",
  component: EditableMediaGrid,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onRankChange: { action: "rank changed" },
    onReviewClick: { action: "review clicked" },
  },
  decorators: [
    (Story) => (
      <DndContext>
        <Story />
      </DndContext>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EditableMediaGrid>;

// ── Mock Data ────────────────────────────────────────────

const mockItems: EditableGridItem[] = [
  {
    id: "1",
    coverUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    title: "Inception",
    mediaType: "Movie",
    year: "2010",
    rating: 8.4,
    rank: 1,
    review: "A mind-bending masterpiece.",
  },
  {
    id: "2",
    coverUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    title: "The Dark Knight",
    mediaType: "Movie",
    year: "2008",
    rating: 9.0,
    rank: 2,
    review: null,
  },
  {
    id: "3",
    coverUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    title: "Interstellar",
    mediaType: "Movie",
    year: "2014",
    rating: 8.7,
    rank: 3,
    review: "A breathtaking journey through space.",
  },
  {
    id: "4",
    coverUrl: "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg",
    title: "Dunkirk",
    mediaType: "Movie",
    year: "2017",
    rating: 7.9,
    rank: 4,
    review: null,
  },
  {
    id: "5",
    coverUrl: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
    title: "Joker",
    mediaType: "Movie",
    year: "2019",
    rating: 8.2,
    rank: 5,
    review: null,
  },
  {
    id: "6",
    coverUrl: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    title: "Avengers: Endgame",
    mediaType: "Movie",
    year: "2019",
    rating: 8.3,
    rank: 6,
    review: "Epic conclusion.",
  },
  {
    id: "7",
    coverUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    title: "The Matrix",
    mediaType: "Movie",
    year: "1999",
    rating: 8.7,
    rank: 7,
    review: null,
  },
  {
    id: "8",
    coverUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    title: "Fight Club",
    mediaType: "Movie",
    year: "1999",
    rating: 8.4,
    rank: 8,
    review: null,
  },
  {
    id: "9",
    coverUrl: null,
    title: "Untitled Project",
    mediaType: "Game",
    year: "2025",
    rating: null,
    rank: 9,
    review: null,
  },
  {
    id: "10",
    coverUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    title: "The Lord of the Rings: The Fellowship of the Ring",
    mediaType: "Movie",
    year: "2001",
    rating: 8.9,
    rank: 10,
    review: "An epic adventure begins.",
  },
  {
    id: "11",
    coverUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    title: "Pulp Fiction",
    mediaType: "Movie",
    year: "1994",
    rating: 8.9,
    rank: 11,
    review: null,
  },
  {
    id: "12",
    coverUrl: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
    title: "Goodfellas",
    mediaType: "Movie",
    year: "1990",
    rating: 8.7,
    rank: 12,
    review: null,
  },
];

// ── Stories ──────────────────────────────────────────────

export const Default: Story = {
  args: {
    items: mockItems,
    columns: 5,
  },
  name: "Default — 12 items, 5 columns",
};

export const FewItems: Story = {
  args: {
    items: mockItems.slice(0, 4),
    columns: 5,
  },
  name: "Few items — 4 items",
};

export const ManyItems: Story = {
  args: {
    items: [
      ...mockItems,
      ...mockItems.slice(0, 8).map((item, i) => ({
        ...item,
        id: `extra-${i}`,
        title: `${item.title} (Copy)`,
        rank: mockItems.length + i + 1,
      })),
    ],
    columns: 5,
  },
  name: "Many items — 20 items",
};

export const NoRatings: Story = {
  args: {
    items: mockItems.map((item) => ({ ...item, rating: null })),
    columns: 5,
  },
  name: "No ratings",
};

export const MixedTypes: Story = {
  args: {
    items: [
      ...mockItems.slice(0, 3),
      { ...mockItems[3], mediaType: "Game", title: "Cyberpunk 2077", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5p2d.jpg" },
      { ...mockItems[4], mediaType: "Series", title: "Breaking Bad", rating: 9.5 },
      { ...mockItems[5], mediaType: "Game", title: "Elden Ring", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5v3y.jpg", rating: 9.6 },
      ...mockItems.slice(6, 10),
    ],
    columns: 5,
  },
  name: "Mixed types — Movies, Games, Series",
};

export const FourColumns: Story = {
  args: {
    items: mockItems.slice(0, 8),
    columns: 4,
  },
  name: "4 columns",
};

export const SixColumns: Story = {
  args: {
    items: mockItems.slice(0, 12),
    columns: 6,
  },
  name: "6 columns",
};
