import type { Meta, StoryObj } from "@storybook/react-vite"
import { ReviewShowcase, type ReviewData } from "./review-showcase"

const meta: Meta<typeof ReviewShowcase> = {
  title: "Custom/ReviewShowcase",
  component: ReviewShowcase,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
}

export default meta
type Story = StoryObj<typeof ReviewShowcase>

const TMDB = (path: string) => `https://image.tmdb.org/t/p/w500${path}`

const sampleReviews: ReviewData[] = [
  {
    coverUrl: TMDB("/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"),
    title: "Interstellar",
    mediaType: "Movie",
    rating: 8.5,
    date: "2026-05-20",
    review: "A breathtaking journey through space and time. Nolan delivers an emotional masterpiece.",
  },
  {
    coverUrl: TMDB("/or06FN3Dka5tukK1e9sl16pB3iy.jpg"),
    title: "Avengers: Endgame",
    mediaType: "Movie",
    rating: 9.0,
    date: "2026-04-10",
    review: "An epic conclusion. Emotional, action-packed, and deeply satisfying.",
  },
  {
    coverUrl: TMDB("/qJ2tW6WMUDux911r6m7haRef0WH.jpg"),
    title: "The Dark Knight",
    mediaType: "Movie",
    rating: 9.5,
    date: "2026-03-05",
    review: "One of the greatest superhero films ever made. Heath Ledger's Joker is legendary.",
  },
]

const searchableReviews = [
  { id: "r1", title: "Interstellar" },
  { id: "r2", title: "Avengers: Endgame" },
  { id: "r3", title: "The Dark Knight" },
  { id: "r4", title: "Inception" },
  { id: "r5", title: "Joker" },
]

/** Default view mode */
export const Default: Story = {
  args: { title: "Recent Reviews", reviews: sampleReviews },
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Default — view mode",
}

/** Edit mode */
export const Editing: Story = {
  args: {
    title: "Recent Reviews",
    reviews: sampleReviews.slice(0, 2),
    position: 2,
    isEditing: true,
    onTitleChange: () => {},
    onPositionChange: () => {},
    onAddReview: () => {},
    onRemoveReview: () => {},
    onDeleteShowcase: () => {},
    onReorder: () => {},
    searchableReviews,
  },
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Editing — with position, type filter, delete",
}

/** Empty */
export const Empty: Story = {
  args: { title: "No Reviews Yet", reviews: [] },
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Empty — no reviews",
}

/** Long reviews */
export const LongReviews: Story = {
  args: {
    title: "Detailed Reviews",
    reviews: [
      {
        coverUrl: TMDB("/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"),
        title: "Inception",
        mediaType: "Movie",
        rating: 8.8,
        date: "2026-01-12",
        review:
          "Inception is a mind-bending masterpiece that explores the nature of dreams and reality. Christopher Nolan crafts a complex narrative that demands the audience's full attention, rewarding them with stunning visuals, a haunting score, and career-defining performances. The film's layered structure mirrors its subject matter, creating an experience that reveals new details with each viewing.",
      },
      {
        coverUrl: TMDB("/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"),
        title: "Joker",
        mediaType: "Movie",
        rating: 8.2,
        date: "2025-11-30",
        review:
          "A dark and disturbing character study. Joaquin Phoenix delivers a transformative performance that stays with you long after the credits roll. The film's gritty realism and haunting score create an atmosphere of dread.",
      },
    ],
    onReadMore: () => {},
  },
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Long reviews — truncated",
}

/** Narrow width */
export const Narrow: Story = {
  args: { title: "Reviews", reviews: sampleReviews.slice(0, 2) },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  name: "Narrow — 320px",
}
