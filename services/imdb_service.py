import tmdbsimple as tmdb


class MovieAPIService:
    def __init__(self):
        self.api_key = "16576abc186e6a952a34804c16e36f5d"
        tmdb.API_KEY = self.api_key
        self.image_base = "https://image.tmdb.org/t/p"

    def search_movies(self, query):
        """Search for movies by title using tmdbsimple and format results."""
        search = tmdb.Search()
        try:
            search.movie(query=query, language="en-US")
            results = search.results or []
        except Exception:
            return []

        formatted_results = []
        for movie in results:
            formatted_results.append({
                "original_api_id": str(movie.get('id')),
                "title": movie.get('title'),
                "description": movie.get('overview'),
                "release_date": movie.get('release_date'),
                "cover_url": f"{self.image_base}/w500{movie.get('poster_path')}" if movie.get('poster_path') else None,
                "banner_url": f"{self.image_base}/original{movie.get('backdrop_path')}" if movie.get('backdrop_path') else None,
            })

        return formatted_results

    def get_movie_details(self, movie_id):
        """Fetch detailed movie information using tmdbsimple."""
        movie = tmdb.Movies(movie_id)
        try:
            data = movie.info(language="en-US")
            return data
        except Exception:
            return None