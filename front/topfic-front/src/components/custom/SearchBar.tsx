import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { quickSearch } from "@/lib/media/api";
import type { MediaSearchResultWithId } from "@/lib/media/types";

const MEDIA_TYPES = ["All", "Movie", "TV Show", "Game", "Anime", "Manga"];

export function SearchBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState("All");
  const [typeOpen, setTypeOpen] = useState(false);
  const [results, setResults] = useState<MediaSearchResultWithId[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close type dropdown on outside click
  useEffect(() => {
    if (!typeOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [typeOpen]);

  const performSearch = useCallback(async (q: string, type: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const data = await quickSearch(q.trim(), type);
      setResults(data.slice(0, 8));
      setIsOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce(performSearch, 300);

  // Re-search when media type changes (if query is active)
  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch(query, mediaType);
    }
  }, [mediaType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(query, mediaType);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (value: string) => {
    setQuery(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      inputRef.current?.blur();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleResultClick = (mediaId?: string) => {
    setIsOpen(false);
    setQuery("");
    if (mediaId) {
      navigate(`/media/${mediaId}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        {/* Media type dropdown */}
        <div className="relative shrink-0" ref={typeRef}>
          <button
            type="button"
            onClick={() => {
              setTypeOpen(!typeOpen)
              setIsOpen(false)  // close search results when opening type dropdown
            }}
            className="flex items-center gap-1 rounded-md border bg-background/50 backdrop-blur-sm px-2 py-1.5 text-xs hover:bg-background/70 transition-colors"
          >
            {mediaType}
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>
          {typeOpen && (
            <div className="absolute top-full left-0 z-30 mt-1 w-24 rounded-md border bg-popover/90 backdrop-blur-sm shadow-lg py-0.5">
              {MEDIA_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setMediaType(type)
                    setTypeOpen(false)
                  }}
                  className={`w-full truncate px-2 py-1 text-left text-xs hover:bg-muted transition-colors ${mediaType === type ? "font-medium text-primary" : ""}`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true) }}
            placeholder={t("search") || "Search movies & games..."}
            className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
          {loading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </form>

      {/* Quick search dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-md border bg-popover shadow-md py-1 z-50 max-h-80 overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-border
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          {results.map((result, i) => (
            <button
              key={result.id || i}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              onClick={() => handleResultClick(result.id)}
            >
              {result.image ? (
                <img
                  src={result.image}
                  alt={result.titre}
                  className="h-10 w-8 rounded object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-8 rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                  ?
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{result.titre}</p>
                <p className="text-xs text-muted-foreground">
                  {result.type}{result.year ? ` · ${result.year}` : ""}
                </p>
              </div>
            </button>
          ))}
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-muted transition-colors border-t"
            onClick={handleSubmit}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Deep search for &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
