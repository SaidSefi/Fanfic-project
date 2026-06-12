import type { Meta, StoryObj } from "@storybook/react-vite"
import { MediaStatsSummary } from "./media-stats-summary"

const meta: Meta<typeof MediaStatsSummary> = {
  title: "Custom/MediaStatsSummary",
  component: MediaStatsSummary,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
}

export default meta
type Story = StoryObj<typeof MediaStatsSummary>

const sampleData = {
  wishlist: 24,
  consuming: 8,
  completed: 156,
  dropped: 12,
  likes: 340,
  reviews: 47,
}

/** Default at medium width */
export const Default: Story = {
  args: sampleData,
  decorators: [(Story) => <div className="w-96"><Story /></div>],
  name: "Default — w-96 (384px)",
}

/** Narrow container */
export const Narrow: Story = {
  args: sampleData,
  decorators: [(Story) => <div className="w-64"><Story /></div>],
  name: "Narrow — w-64 (256px)",
}

/** Wide container */
export const Wide: Story = {
  args: sampleData,
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Wide — 560px",
}

/** Full width */
export const FullWidth: Story = {
  args: sampleData,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
  name: "Full width",
}

/** Zeroes across the board */
export const Empty: Story = {
  args: {
    wishlist: 0,
    consuming: 0,
    completed: 0,
    dropped: 0,
    likes: 0,
    reviews: 0,
  },
  decorators: [(Story) => <div className="w-96"><Story /></div>],
  name: "Empty — all zero",
}

/** Large numbers */
export const LargeNumbers: Story = {
  args: {
    wishlist: 1250,
    consuming: 432,
    completed: 8921,
    dropped: 567,
    likes: 12400,
    reviews: 1204,
  },
  decorators: [(Story) => <div className="w-96"><Story /></div>],
  name: "Large numbers",
}
