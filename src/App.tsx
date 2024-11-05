import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.scss";

// Define TypeScript types for movie and genre
interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  release_date: string;
  overview: string;
}

interface Genre {
  id: number;
  name: string;
}

const App: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const apiKey = "183963ce5e09132990a05a980126550f";
  const posterUrl = "https://image.tmdb.org/t/p/w200";
  const moviesPerPage = 20;
  const maxMovies = 100;

  const fetchMovies = async (genreId: string = ""): Promise<void> => {
    const fetchedMovies: Movie[] = [];
    let page = 1;
    try {
      while (fetchedMovies.length < maxMovies) {
        const response = await axios.get(
          `https://api.themoviedb.org/3/${
            genreId ? "discover/movie" : "movie/top_rated"
          }`,
          {
            params: {
              api_key: apiKey,
              language: "en-US",
              page,
              ...(genreId && { with_genres: genreId }),
            },
          }
        );

        const filteredMovies = response.data.results.filter(
          (movie: Movie) => movie.vote_count >= 100
        );
        fetchedMovies.push(...filteredMovies);
        if (filteredMovies.length === 0 || response.data.results.length === 0)
          break;
        page += 1;
      }

      const sortedMovies = fetchedMovies
        .slice(0, maxMovies)
        .sort(
          (a, b) =>
            b.vote_average - a.vote_average || b.vote_count - a.vote_count
        );

      setMovies(sortedMovies);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  useEffect(() => {
    const fetchGenres = async (): Promise<void> => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`
        );
        setGenres(response.data.genres);
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    setMovies([]); // Clear movies when genre changes to prevent stale data
    fetchMovies(selectedGenre);
  }, [selectedGenre]);

  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = movies.slice(indexOfFirstMovie, indexOfLastMovie);

  const totalPages = Math.ceil(movies.length / moviesPerPage);

  const renderPagination = (): JSX.Element => (
    <div>
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i + 1}
          onClick={() => setCurrentPage(i + 1)}
          disabled={currentPage === i + 1}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );

  const getGenreNames = (genreIds: number[]): string => {
    return genreIds
      .map((id) => genres.find((genre) => genre.id === id)?.name)
      .filter((name): name is string => !!name)
      .join(", ");
  };

  return (
    <div className="app-container">
      <h1>Movie Ranking</h1>

      <div className="filter-container">
        <label htmlFor="genre-select">Filter by Genre:</label>
        <select
          id="genre-select"
          onChange={(e) => setSelectedGenre(e.target.value)}
          value={selectedGenre}
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id.toString()}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      <ul className="movie-list">
        {currentMovies.map((movie) => (
          <li key={movie.id} className="movie-card">
            {movie.poster_path && (
              <img
                src={`${posterUrl}${movie.poster_path}`}
                alt={`${movie.title} Poster`}
                width="100"
              />
            )}
            <div className="movie-info">
              <h2>{movie.title}</h2>
              <p>Genres: {getGenreNames(movie.genre_ids)}</p>
              <p>
                Rating: {movie.vote_average} ({movie.vote_count} reviews)
              </p>
              <p>Release Date: {movie.release_date}</p>
              <p>{movie.overview}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="pagination">{renderPagination()}</div>
    </div>
  );
};

export default App;
