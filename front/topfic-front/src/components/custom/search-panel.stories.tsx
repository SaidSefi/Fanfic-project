import type { Meta, StoryObj } from "@storybook/react-vite";
import { DndContext } from "@dnd-kit/core";
import { SearchPanel } from "./search-panel";
import type { SearchPanelItem } from "./search-panel";

const meta: Meta<typeof SearchPanel> = {
  title: "Custom/SearchPanel",
  component: SearchPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onCategoryChange: { action: "category changed" },
    onSearchChange: { action: "search changed" },
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
type Story = StoryObj<typeof SearchPanel>;

// ── Fake data ────────────────────────────────────────────

const mockItems: SearchPanelItem[] = [
  {
    id: "1",
    title: "Inception",
    coverUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911B5MrVMVWVGWC.jpg",
    mediaType: "Movie",
    year: "2010",
  },
  {
    id: "2",
    title: "Interstellar",
    coverUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    mediaType: "Movie",
    year: "2014",
  },
  {
    id: "3",
    title: "The Dark Knight",
    coverUrl: "https://image.tmdb.org/t/p/w500/rPdtLWNsZmAtoZl9PK7S2wE3qiS.jpg",
    mediaType: "Movie",
    year: "2008",
  },
  {
    id: "4",
    title: "Pulp Fiction",
    coverUrl: "https://image.tmdb.org/t/p/w500/56zTpe2xvaEpZ6qj7Jb5k7vT0Yt.jpg",
    mediaType: "Movie",
    year: "1994",
  },
  {
    id: "5",
    title: "The Matrix",
    coverUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDPl2tQPP1Erm0Vt0pb.jpg",
    mediaType: "Movie",
    year: "1999",
  },
  {
    id: "6",
    title: "Cyberpunk 2077",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5p2d.jpg",
    mediaType: "Game",
    year: "2020",
  },
  {
    id: "7",
    title: "Elden Ring",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5v3y.jpg",
    mediaType: "Game",
    year: "2022",
  },
  {
    id: "8",
    title: "The Legend of Zelda: Breath of the Wild",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5p2d.jpg",
    mediaType: "Game",
    year: "2017",
  },
  {
    id: "9",
    title: "Breaking Bad",
    coverUrl: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L1VgMbwwJDZMzd.jpg",
    mediaType: "Series",
    year: "2008",
  },
  {
    id: "10",
    title: "Stranger Things",
    coverUrl: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    mediaType: "Series",
    year: "2016",
  },
  {
    id: "11",
    title: "Fight Club",
    coverUrl: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLIbRLmYj.jpg",
    mediaType: "Movie",
    year: "1999",
  },
  {
    id: "12",
    title: "Goodfellas",
    coverUrl: null,
    mediaType: "Movie",
    year: "1990",
  },
];

// ── Stories ──────────────────────────────────────────────

export const Default: Story = {
  args: {
    categories: ["All", "Movie", "Game", "Series"],
    items: mockItems,
    searchPlaceholder: "Search media...",
    className: "h-[650px]",
  },
  name: "Default — All categories",
};

export const WithFixedHeight: Story = {
  args: {
    categories: ["All", "Movie", "Game", "Series"],
    items: mockItems,
    searchPlaceholder: "Search...",
    className: "h-96",
  },
  name: "Fixed height — 384px",
};

export const TwoCategories: Story = {
  args: {
    categories: ["All", "Movie"],
    items: mockItems,
    searchPlaceholder: "Search movies...",
    className: "h-[650px]",
  },
  name: "Two categories only",
};

export const FewItems: Story = {
  args: {
    categories: ["All", "Movie", "Game"],
    items: mockItems.slice(0, 5),
    searchPlaceholder: "Search...",
  },
  name: "Few items — 5 results",
};

export const NoItems: Story = {
  args: {
    categories: ["All", "Movie", "Game", "Series"],
    items: [],
    searchPlaceholder: "Search...",
  },
  name: "Empty — no items",
};

export const LongerCategories: Story = {
  args: {
    categories: ["All", "Action", "Comedy", "Drama", "Horror"],
    items: mockItems,
    searchPlaceholder: "Search by genre...",
  },
  name: "Many categories — 5 buttons",
};
