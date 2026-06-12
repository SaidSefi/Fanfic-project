import type { Meta, StoryObj } from "@storybook/react-vite"
import { ReviewCard } from "./review-card"

const meta: Meta<typeof ReviewCard> = {
  title: "Custom/ReviewCard",
  component: ReviewCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-120"><Story /></div>],
}

export default meta
type Story = StoryObj<typeof ReviewCard>

const TMDB = (path: string) => `https://image.tmdb.org/t/p/w500${path}`

export const Default: Story = {
  args: {
    coverUrl: TMDB("/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"),
    title: "Interstellar",
    mediaType: "Movie",
    rating: 8.5,
    date: "2026-05-20",
    review: "A breathtaking journey through space and time. Nolan delivers an emotional and visually stunning masterpiece.",
  },
  name: "Default — full data",
}

export const NoRating: Story = {
  args: {
    coverUrl: TMDB("/or06FN3Dka5tukK1e9sl16pB3iy.jpg"),
    title: "Avengers: Endgame",
    mediaType: "Movie",
    date: "2026-04-10",
    review: "An epic conclusion to the Infinity Saga. Emotional, action-packed, and deeply satisfying.",
  },
  name: "No rating",
}

export const NoDate: Story = {
  args: {
    coverUrl: TMDB("/qJ2tW6WMUDux911r6m7haRef0WH.jpg"),
    title: "The Dark Knight",
    mediaType: "Movie",
    rating: 9.0,
    review: "One of the greatest superhero films ever made.",
  },
  name: "No date",
}

export const LongReview: Story = {
  args: {
    coverUrl: TMDB("/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"),
    title: "Inception",
    mediaType: "Movie",
    rating: 8.8,
    date: "2026-03-15",
    review:
      "Inception is a mind-bending masterpiece that explores the nature of dreams and reality. Christopher Nolan crafts a complex narrative that demands the audience's full attention, rewarding them with stunning visuals, a haunting score by Hans Zimmer, and career-defining performances from the entire cast. The film's layered structure mirrors its subject matter, creating an experience that reveals new details with each viewing. From the zero-gravity hallway fight to the climactic kick sequence, every scene is meticulously crafted. The emotional core of Cobb's relationship with Mal grounds the high-concept sci-fi in genuine human drama. A true modern classic that continues to inspire debate and discussion years after its release.",
    onReadMore: () => {},
  },
  name: "Long review — truncated",
}

export const NoCover: Story = {
  args: {
    coverUrl: null,
    title: "Unknown Media",
    mediaType: "Game",
    rating: 7.0,
    review: "Pretty good game overall.",
  },
  name: "No cover image",
}
