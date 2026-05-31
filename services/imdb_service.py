import requests

class MovieAPIService:
    def __init__(self):
        self.api_key = "16576abc186e6a952a34804c16e36f5d"
        self.base_url = "https://api.themoviedb.org/3"

    def search_movies(self, query):
        """Search for movies by title to display results in your frontend search bar"""
        url = f"{self.base_url}/search/movie"
        params = {
            "api_key": self.api_key,
            "query": query,
            "language": "en-US"
        }
        
        response = requests.get(url, params=params)
        if response.status_code == 200:
            results = response.json().get('results', [])
            
            # Format the data cleanly to match your frontend requirements
            formatted_results = []
            for movie in results:
                formatted_results.append({
                    "original_api_id": str(movie.get('id')),
                    "title": movie.get('title'),
                    "description": movie.get('overview'),
                    "release_date": movie.get('release_date'),
                    "cover_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get('poster_path') else None,
                    "banner_url": f"https://image.tmdb.org/t/p/original{movie.get('backdrop_path')}" if movie.get('backdrop_path') else None
                })
            return formatted_results
        return []

    def get_movie_details(self, movie_id):
        """Fetch deep details for a single item when clicked"""
        url = f"{self.base_url}/movie/{movie_id}"
        params = {"api_key": self.api_key, "language": "en-US"}
        
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        return None