import { useState } from "react"
import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RatingDistribution } from "@/components/custom/rating-distribution"
import { ListShowcase } from "@/components/custom/list-showcase"
import { ReviewShowcase, type ReviewData } from "@/components/custom/review-showcase"
import type { ListCardData } from "@/components/custom/user-lists-panel"
import { ListCard } from "@/components/custom/list-card"
import { Plus, Pencil, X } from "lucide-react"

// ── Mock data ────────────────────────────────────────────

const TMDB = (path: string) => `https://image.tmdb.org/t/p/w500${path}`

const mockProfile = {
  username: "johnsmith",
  avatarUrl: null,
  bio: "Movie enthusiast and aspiring critic. I love sci-fi, thrillers, and anything Christopher Nolan.",
  joinedAt: "2025-03-15",
  totalLists: 6,
  totalReviews: 24,
  totalLikes: 340,
  isOwner: true,
}

const mockRatingDistribution = {
  5: 45, 4.5: 38, 4: 52, 3.5: 30, 3: 25, 2.5: 12,
  2: 8, 1.5: 4, 1: 2, 0.5: 1, 0: 0,
}

const mockLists: ListCardData[] = [
  { id: "l1", title: "Top Sci-Fi Movies", coverUrls: [TMDB("/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"), TMDB("/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"), TMDB("/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg")] },
  { id: "l2", title: "Favorite Thrillers", coverUrls: [TMDB("/qJ2tW6WMUDux911r6m7haRef0WH.jpg"), TMDB("/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"), TMDB("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg")] },
  { id: "l3", title: "Weekend Watchlist", coverUrls: [TMDB("/b4Oe15CGLL61Ped0RAS9JpqdmCt.jpg"), null, null] },
]

const mockReviews: ReviewData[] = [
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
    review: "An epic conclusion to the Infinity Saga. Emotional, action-packed, and deeply satisfying.",
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

// ── Component ────────────────────────────────────────────

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const [isEditing, setIsEditing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const profile = mockProfile

  const [editBio, setEditBio] = useState(profile.bio)
  const [editAvatarUrl, setEditAvatarUrl] = useState(profile.avatarUrl ?? "")

  const [listShowcaseLists, setListShowcaseLists] = useState(mockLists)
  const [reviewShowcaseReviews, setReviewShowcaseReviews] = useState(mockReviews)
  const [listShowcaseTitle, setListShowcaseTitle] = useState("My Favorite Lists")
  const [reviewShowcaseTitle, setReviewShowcaseTitle] = useState("Recent Reviews")
  const [listShowcasePos, setListShowcasePos] = useState(1)
  const [reviewShowcasePos, setReviewShowcasePos] = useState(2)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ── Profile Header ── */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* Avatar */}
        <div className="shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="size-24 sm:size-28 rounded-full object-cover border-4 border-background shadow-xl"
            />
          ) : (
            <div className="size-24 sm:size-28 rounded-full bg-primary/10 border-4 border-background shadow-xl flex items-center justify-center text-3xl font-bold text-primary">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">@{profile.username}</h1>

          {profile.bio && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg">
              {profile.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{profile.totalLists}</strong> lists
            </span>
            <span>
              <strong className="text-foreground">{profile.totalReviews}</strong> reviews
            </span>
            <span>
              <strong className="text-foreground">{profile.totalLikes}</strong> likes
            </span>
            {profile.joinedAt && (
              <span>
                Joined {new Date(profile.joinedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Edit button (owner only) */}
        {profile.isOwner && (
          <div className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Pencil size={14} className="mr-1.5" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* ── Content area: Center column + Right sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Center column — Tabs + Showcases */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="profile">
            <TabsList variant="line" className="mb-6 w-full justify-start gap-4">
              <TabsTrigger value="profile" className="px-1 text-sm font-medium">
                Profile
              </TabsTrigger>
              <TabsTrigger value="media" className="px-1 text-sm font-medium">
                Media
              </TabsTrigger>
              <TabsTrigger value="lists" className="px-1 text-sm font-medium">
                Lists
              </TabsTrigger>
              <TabsTrigger value="journal" className="px-1 text-sm font-medium">
                Journal
              </TabsTrigger>
              <TabsTrigger value="friends" className="px-1 text-sm font-medium">
                Friends
              </TabsTrigger>
              <TabsTrigger value="likes" className="px-1 text-sm font-medium">
                Likes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-8">
              {/* List Showcase */}
              <ListShowcase
                title={listShowcaseTitle}
                lists={listShowcaseLists}
                position={listShowcasePos}
                isEditing={isEditing}
                onTitleChange={setListShowcaseTitle}
                onPositionChange={setListShowcasePos}
                onAddList={() => {}}
                onRemoveList={(id) =>
                  setListShowcaseLists((prev) => prev.filter((l) => l.id !== id))
                }
                onReorder={setListShowcaseLists}
                onDeleteShowcase={() => {}}
                searchableLists={[
                  { id: "l1", title: "Top Sci-Fi Movies" },
                  { id: "l2", title: "Favorite Thrillers" },
                  { id: "l3", title: "Weekend Watchlist" },
                ]}
              />

              {/* Review Showcase */}
              <ReviewShowcase
                title={reviewShowcaseTitle}
                reviews={reviewShowcaseReviews}
                position={reviewShowcasePos}
                isEditing={isEditing}
                onTitleChange={setReviewShowcaseTitle}
                onPositionChange={setReviewShowcasePos}
                onAddReview={() => {}}
                onRemoveReview={(title) =>
                  setReviewShowcaseReviews((prev) =>
                    prev.filter((r) => r.title !== title),
                  )
                }
                onReorder={setReviewShowcaseReviews}
                onDeleteShowcase={() => {}}
                searchableReviews={[
                  { id: "r1", title: "Interstellar", mediaType: "Movie" },
                  { id: "r2", title: "The Dark Knight", mediaType: "Movie" },
                ]}
              />

              {/* Add showcase button (edit mode) */}
              {isEditing && (
                <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Plus size={18} />
                  <span className="text-sm font-medium">Add Showcase</span>
                </button>
              )}

              {/* Extra space so dropdowns have room */}
              <div className="pb-40" />
            </TabsContent>

            <TabsContent value="media">
              <p className="py-8 text-center text-sm text-muted-foreground">
                Media coming soon.
              </p>
            </TabsContent>

            <TabsContent value="lists">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">My Lists</h2>
                <Button size="sm" variant="outline">
                  <Plus size={14} className="mr-1.5" />
                  New List
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {mockLists.map((list) => (
                  <ListCard
                    key={list.id}
                    title={list.title}
                    coverUrls={list.coverUrls}
                    truncate
                    onClick={() => {}}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="journal">
              <p className="py-8 text-center text-sm text-muted-foreground">
                Journal coming soon.
              </p>
            </TabsContent>

            <TabsContent value="friends">
              <p className="py-8 text-center text-sm text-muted-foreground">
                Friends coming soon.
              </p>
            </TabsContent>

            <TabsContent value="likes">
              <p className="py-8 text-center text-sm text-muted-foreground">
                Likes coming soon.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-6">
          {/* Edit toggle */}
          {profile.isOwner && (
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              className="w-full"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil size={14} className="mr-1.5" />
              {isEditing ? "Done Editing" : "Edit Showcases"}
            </Button>
          )}

          {/* Average rating */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Rating Distribution
            </p>
            <RatingDistribution
              distribution={mockRatingDistribution}
              maxHeight={140}
            />
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card shadow-xl">
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                // TODO: save to backend
                setShowEditModal(false)
              }}
              className="space-y-4 px-6 pb-6"
            >
              <div>
                <Label htmlFor="edit-avatar">Avatar URL</Label>
                <Input
                  id="edit-avatar"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea
                  id="edit-bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
