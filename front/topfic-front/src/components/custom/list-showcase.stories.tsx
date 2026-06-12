import type { Meta, StoryObj } from "@storybook/react-vite"
import { ListShowcase } from "./list-showcase"
import type { ListCardData } from "./user-lists-panel"

const meta: Meta<typeof ListShowcase> = {
  title: "Custom/ListShowcase",
  component: ListShowcase,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
}

export default meta
type Story = StoryObj<typeof ListShowcase>

const TMDB = (path: string) => `https://image.tmdb.org/t/p/w500${path}`

const sampleLists: ListCardData[] = [
  { id: "1", title: "Top Sci-Fi Movies", coverUrls: [TMDB("/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"), TMDB("/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"), TMDB("/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg")] },
  { id: "2", title: "Favorite Thrillers", coverUrls: [TMDB("/qJ2tW6WMUDux911r6m7haRef0WH.jpg"), TMDB("/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"), TMDB("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg")] },
  { id: "3", title: "Weekend Watchlist", coverUrls: [TMDB("/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg"), null, null] },
  { id: "4", title: "All-Time Favorites", coverUrls: [TMDB("/or06FN3Dka5tukK1e9sl16pB3iy.jpg"), TMDB("/qJ2tW6WMUDux911r6m7haRef0WH.jpg"), TMDB("/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg")] },
  { id: "5", title: "Anime Collection", coverUrls: [null, null, null] },
  { id: "6", title: "Horror Marathon", coverUrls: [TMDB("/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"), null, TMDB("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg")] },
]

const searchableLists = [
  { id: "1", title: "Top Sci-Fi Movies" },
  { id: "2", title: "Favorite Thrillers" },
  { id: "3", title: "Weekend Watchlist" },
  { id: "4", title: "All-Time Favorites" },
  { id: "5", title: "Anime Collection" },
  { id: "6", title: "Horror Marathon" },
  { id: "7", title: "Classic Cinema" },
  { id: "8", title: "Recent Watches" },
]

/** Default view mode */
export const Default: Story = {
  args: { title: "My Favorite Lists", lists: sampleLists },
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Default — view mode",
}

/** Edit mode — can add/remove lists */
export const Editing: Story = {
  args: {
    title: "My Favorite Lists",
    lists: sampleLists.slice(0, 3),
    position: 1,
    isEditing: true,
    onTitleChange: () => {},
    onPositionChange: () => {},
    onAddList: () => {},
    onRemoveList: () => {},
    onDeleteShowcase: () => {},
    onReorder: () => {},
    searchableLists,
  },
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Editing — with position, search, delete",
}

/** Empty showcase */
export const Empty: Story = {
  args: { title: "Empty Showcase", lists: [] },
  decorators: [(Story) => <div className="w-140"><Story /></div>],
  name: "Empty — no lists",
}

/** Narrow width */
export const Narrow: Story = {
  args: { title: "My Lists", lists: sampleLists.slice(0, 4) },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  name: "Narrow — 320px",
}
