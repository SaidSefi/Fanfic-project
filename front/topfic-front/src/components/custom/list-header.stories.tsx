import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListHeader } from "./list-header";

const meta: Meta<typeof ListHeader> = {
  title: "Custom/ListHeader",
  component: ListHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onTitleChange: { action: "title changed" },
    onDescriptionChange: { action: "description changed" },
  },
};

export default meta;
type Story = StoryObj<typeof ListHeader>;

export const Default: Story = {
  args: {
    title: "Top 10 Sci-Fi Movies of All Time",
    description:
      "A hand-picked selection of the most influential and mind-bending science fiction films ever made. From dystopian futures to interstellar journeys.",
    updatedAt: "June 3, 2026 at 14:30",
  },
  name: "Default — Full data",
};

export const NoDescription: Story = {
  args: {
    title: "Favorite Games of 2025",
    updatedAt: "Yesterday at 9:15 AM",
  },
  name: "No description",
};

export const NoDate: Story = {
  args: {
    title: "Weekend Watchlist",
    description: "Movies I plan to watch this weekend.",
  },
  name: "No date",
};

export const TitleOnly: Story = {
  args: {
    title: "Unsorted Collection",
  },
  name: "Title only",
};

export const LongTitle: Story = {
  args: {
    title: "The Definitive Collection of Masterpieces That Defined Modern Cinema Across Multiple Decades and Genres",
    description: "A comprehensive list spanning from the golden age of Hollywood to contemporary streaming-era gems.",
    updatedAt: "2026-06-03T14:30:00Z",
  },
  name: "Long title",
};

export const LongDescription: Story = {
  args: {
    title: "Horror Marathon",
    description:
      "A carefully curated selection of horror films ranging from psychological thrillers to supernatural terrors. This list includes classic masterpieces from the 1970s alongside modern indie gems that push the boundaries of the genre. Each film has been chosen for its unique contribution to horror cinema.",
    updatedAt: "Updated 2 hours ago",
  },
  name: "Long description",
};

/** Editable mode — title input + description textarea */
export const Editing: Story = {
  args: {
    title: "Top Sci-Fi Movies",
    description: "My personal list of must-watch science fiction films.",
    updatedAt: "June 3, 2026 at 14:30",
    onTitleChange: () => {},
    onDescriptionChange: () => {},
  },
  name: "Editing — inline inputs",
};
