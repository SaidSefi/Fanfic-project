export interface MediaSearchResult {
  id?: string;
  titre: string;
  image: string | null;
  score: number;
  type: string;
  year?: string | null;
}

export interface MediaSearchResultWithId {
  id: string;
  titre: string;
  image: string | null;
  score: number;
  type: string;
  year?: string | null;
}

export interface DeepSearchResult {
  id: string;
  titre: string;
  image: string | null;
  score: number;
  type: string;
  source: string;
}

export interface MediaDetail {
  titre: string;
  cover: string | null;
  banner: string | null;
  synopsis: string | null;
  release_date: string | null;
  average_rating: number;
  total_reviews: number;
  type: string | null;
  stats: {
    wishlist: number;
    consuming: number;
    completed: number;
    dropped: number;
    likes: number;
    reviews: number;
  };
  rating_distribution: Record<string, number>;
}

export interface MediaReview {
  user: string;
  review: string | null;
  rating: number | null;
  created_at: string | null;
}

export interface RelatedMedia {
  id: string;
  cover: string | null;
  nom: string;
  type: string | null;
  year: string | null;
  relation_type: string | null;
}
