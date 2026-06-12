import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { deepSearch } from "@/lib/media/api";
import type { DeepSearchResult } from "@/lib/media/types";

const MEDIA_TYPES = ["All", "Movie", "TV Show", "Game", "Anime", "Manga"];

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<DeepSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState("All");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    deepSearch(query.trim())
      .then((data) => setResults(data))
      .catch(() => setError("Search failed. Please try again."))
      .finally(() => setLoading(false));
  }, [query]);

  const filteredResults = (() => {
    if (mediaTab === "All") return results;
    // TV Show also includes TV Season
    if (mediaTab === "TV Show") {
      return results.filter((r) => r.type === "TV Show" || r.type === "TV Season");
    }
    return results.filter((r) => r.type === mediaTab);
  })();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Top-level tabs: Media / Users / Lists */}
      <Tabs defaultValue="media" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList variant="line" className="gap-4">
            <TabsTrigger value="media" className="px-1 text-sm font-medium">
              Media
            </TabsTrigger>
            <TabsTrigger value="users" className="px-1 text-sm font-medium">
              Users
            </TabsTrigger>
            <TabsTrigger value="lists" className="px-1 text-sm font-medium">
              Lists
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Media tab */}
        <TabsContent value="media">
          {/* Sub-tabs for media types — use buttons to avoid nested Tabs conflict */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex gap-4 border-b border-border pb-1">
              {MEDIA_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMediaTab(type)}
                  className={`px-1 text-sm font-medium capitalize transition-colors border-b-2 -mb-1.25 ${
                    mediaTab === type
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-16 text-destructive">{error}</div>
          )}

          {/* Results */}
          {!loading && !error && filteredResults.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredResults.length} result{filteredResults.length > 1 ? "s" : ""} for &quot;{query}&quot;
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredResults.map((result) => (
                  <Link
                    key={result.id}
                    to={`/media/${result.id}`}
                    className="group flex flex-col items-center rounded-lg p-1 transition-colors hover:bg-muted/30"
                  >
                    {/* Cover */}
                    <div className="aspect-2/3 w-full overflow-hidden rounded-md bg-muted shadow-sm">
                      {result.image ? (
                        <img
                          src={result.image}
                          alt={result.titre}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground/50">
                          ?
                        </div>
                      )}
                    </div>

                    {/* Badge */}
                    <div className="mt-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {result.type}
                      </Badge>
                    </div>

                    {/* Title */}
                    <p className="mt-1 text-sm font-medium leading-tight truncate w-full text-center group-hover:text-primary transition-colors">
                      {result.titre}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {!loading && !error && query && filteredResults.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold mb-2">No results found</h2>
              <p className="text-muted-foreground">
                We couldn&apos;t find anything for &quot;{query}&quot;. Try a different search term.
              </p>
            </div>
          )}

          {/* Initial state */}
          {!loading && !error && !query && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-xl font-semibold mb-2">Discover media</h2>
              <p className="text-muted-foreground">
                Search for movies, games, and more to add to your library.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          <p className="py-16 text-center text-sm text-muted-foreground">
            User search coming soon.
          </p>
        </TabsContent>

        <TabsContent value="lists">
          <p className="py-16 text-center text-sm text-muted-foreground">
            List search coming soon.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
