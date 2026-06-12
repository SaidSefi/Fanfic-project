import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserListsPanel } from "./user-lists-panel";
import type { ListCardData } from "./user-lists-panel";

const meta: Meta<typeof UserListsPanel> = {
  title: "Custom/UserListsPanel",
  component: UserListsPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onAddFriend: { action: "add friend clicked" },
    onListClick: { action: "list clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof UserListsPanel>;

const mockLists: ListCardData[] = [
  {
    id: "l1", title: "Top Sci-Fi Movies",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    ],
  },
  {
    id: "l2", title: "Horror Marathon",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
      "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      null,
    ],
  },
  {
    id: "l3", title: "Games of the Year",
    coverUrls: [
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co5p2d.jpg",
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co5v3y.jpg",
      null,
    ],
  },
  {
    id: "l4", title: "Weekend Watchlist",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      "https://image.tmdb.org/t/p/w500/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg",
      "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    ],
  },
  {
    id: "l5", title: "Classic Films",
    coverUrls: [
      "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      null,
      null,
    ],
  },
  {
    id: "l6", title: "Empty List",
    coverUrls: [null, null, null],
  },
];

export const Default: Story = {
  args: {
    username: "alice",
    avatarUrl: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=alice",
    showAddFriend: true,
    lists: mockLists,
    className: "h-[650px]",
  },
  name: "Default — with add friend",
};

export const NoFriendButton: Story = {
  args: {
    username: "bob",
    avatarUrl: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=bob",
    showAddFriend: false,
    lists: mockLists.slice(0, 4),
    className: "h-[650px]",
  },
  name: "Without add friend button",
};

export const NoAvatar: Story = {
  args: {
    username: "charlie",
    avatarUrl: null,
    showAddFriend: true,
    lists: mockLists.slice(0, 3),
    className: "h-[650px]",
  },
  name: "No avatar — initial letter",
};

export const EmptyLists: Story = {
  args: {
    username: "newuser",
    avatarUrl: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=newuser",
    lists: [],
    className: "h-[400px]",
  },
  name: "Empty — no lists yet",
};

export const ManyLists: Story = {
  args: {
    username: "collector",
    avatarUrl: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=collector",
    showAddFriend: true,
    lists: [...mockLists, ...mockLists.map((l) => ({ ...l, id: l.id + "-2", title: l.title + " 2" }))],
    className: "h-[650px]",
  },
  name: "Many lists — scrollable",
};
