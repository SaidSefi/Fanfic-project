import type { Meta, StoryObj } from "@storybook/react-vite"
import { RelatedMedia, type RelatedMediaGroup } from "./related-media"

const meta: Meta<typeof RelatedMedia> = {
  title: "Custom/RelatedMedia",
  component: RelatedMedia,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
}

export default meta
type Story = StoryObj<typeof RelatedMedia>

// ── Mock data ────────────────────────────────────────────

function makeItems(
  prefix: string,
  count: number,
  type: string,
): RelatedMediaGroup["items"] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `${prefix} Title ${i + 1}`,
    coverUrl: null,
    mediaType: type,
    year: `${2020 + (i % 5)}`,
  }))
}

const sampleGroups: RelatedMediaGroup[] = [
  { type: "Prequels", items: makeItems("Prequel", 3, "Movie") },
  { type: "Sequels", items: makeItems("Sequel", 8, "Movie") },
  { type: "Similar", items: makeItems("Similar", 12, "TV Show") },
  { type: "Spin-offs", items: makeItems("Spinoff", 2, "Game") },
]

/** Default at medium width */
export const Default: Story = {
  args: { groups: sampleGroups },
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Default — 560px",
}

/** Narrow container */
export const Narrow: Story = {
  args: { groups: sampleGroups },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  name: "Narrow — w-80 (320px)",
}

/** Wide container */
export const Wide: Story = {
  args: { groups: sampleGroups },
  decorators: [(Story) => <div className="w-240"><Story /></div>],
  name: "Wide — 960px",
}

/** Full width */
export const FullWidth: Story = {
  args: { groups: sampleGroups },
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="p-8"><Story /></div>],
  name: "Full width",
}

/** Single group with one item (should not shrink) */
export const SingleItem: Story = {
  args: {
    groups: [
      { type: "Sequels", items: makeItems("Sequel", 1, "Movie") },
    ],
  },
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Single item — doesn't shrink",
}
