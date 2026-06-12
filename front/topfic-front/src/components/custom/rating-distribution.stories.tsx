import type { Meta, StoryObj } from "@storybook/react-vite"
import { RatingDistribution } from "./rating-distribution"

const meta: Meta<typeof RatingDistribution> = {
  title: "Custom/RatingDistribution",
  component: RatingDistribution,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-120">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof RatingDistribution>

/** A balanced spread across all ratings */
export const Balanced: Story = {
  args: {
    distribution: {
      5: 42, 4.5: 35, 4: 38, 3.5: 32, 3: 35, 2.5: 28,
      2: 30, 1.5: 22, 1: 25, 0.5: 18, 0: 20,
    },
  },
  name: "Balanced — All ratings",
}

/** Heavily skewed toward 5 stars (typical for popular media) */
export const TopHeavy: Story = {
  args: {
    distribution: {
      5: 320, 4.5: 210, 4: 180, 3.5: 110, 3: 65, 2.5: 35,
      2: 20, 1.5: 12, 1: 8, 0.5: 6, 0: 5,
    },
  },
  name: "Top-heavy — mostly 5★",
}

/** Bell curve around 3 stars */
export const BellCurve: Story = {
  args: {
    distribution: {
      5: 20, 4.5: 35, 4: 70, 3.5: 110, 3: 200, 2.5: 180,
      2: 130, 1.5: 80, 1: 50, 0.5: 30, 0: 15,
    },
  },
  name: "Bell curve — centered on 3★",
}

/** Polarizing: lots of 5s and 1s, few in the middle */
export const Polarizing: Story = {
  args: {
    distribution: {
      5: 150, 4.5: 80, 4: 30, 3.5: 18, 3: 20, 2.5: 15,
      2: 25, 1.5: 60, 1: 140, 0.5: 90, 0: 30,
    },
  },
  name: "Polarizing — 5★ vs 1★",
}

/** Only a few ratings with sparse data */
export const Sparse: Story = {
  args: {
    distribution: {
      5: 8, 4.5: 5, 4: 3, 3.5: 2, 3: 1,
    },
  },
  name: "Sparse — only top half",
}

/** No ratings at all */
export const Empty: Story = {
  args: {
    distribution: {},
  },
  name: "Empty — no ratings",
}

/** Single 4.5-star rating */
export const SingleRating: Story = {
  args: {
    distribution: {
      4.5: 1,
    },
  },
  name: "Single — one 4.5★ rating",
}

/** Narrow container makes thinner bars */
export const NarrowChart: Story = {
  args: {
    distribution: {
      5: 85, 4.5: 60, 4: 42, 3.5: 30, 3: 28, 2.5: 20,
      2: 12, 1.5: 8, 1: 5, 0.5: 3, 0: 2,
    },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  name: "Narrow — thin bars via container",
}

/** Taller chart with custom maxHeight */
export const TallChart: Story = {
  args: {
    distribution: {
      5: 85, 4.5: 60, 4: 42, 3.5: 30, 3: 28, 2.5: 20,
      2: 12, 1.5: 8, 1: 5, 0.5: 3, 0: 2,
    },
    maxHeight: 280,
  },
  name: "Tall chart — maxHeight 280",
}
