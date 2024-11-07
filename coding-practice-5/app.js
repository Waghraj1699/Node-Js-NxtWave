const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

dbPath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Success...')
    })
  } catch (e) {
    console.log(`DB Error: $"{e}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertMovieDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

const convertDirectorDbObjectToResponseObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

// API 1

app.get('/movies/', async (request, response) => {
  const getAllMovies = `
  SELECT
    movie_name
  FROM
    movie;`

  const allMovies = await db.all(getAllMovies)
  response.send(allMovies.map(eachMovie => ({movieName: eachMovie.movie_name})))
})

// API 2

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  console.log(movieDetails)

  const addMovieQuery = `
  INSERT INTO
    movie (director_id,movie_name,lead_actor)
  VALUES 
  (
    ${directorId},
    '${movieName}',
    '${leadActor}'
  );`

  const dbResponse = await db.run(addMovieQuery)
  console.log(dbResponse)

  response.send('Movie Successfully Added')
})

// API 3

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  console.log(movieId)
  const getMovieQuery = `
  SELECT 
    *
  FROM
    movie
  WHERE
  movie_id = ${movieId};`

  const movie = await db.get(getMovieQuery)
  response.send(convertMovieDbObjectToResponseObject(movie))
})

// API 4

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body

  const {directorId, movieName, leadActor} = movieDetails

  const updateMovieQuery = `
  UPDATE
    movie
  SET 
    director_id = '${directorId}',
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
  WHERE
    movie_id = ${movieId};`

  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

// API 5

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  console.log(movieId)

  const deleteMovie = `
  DELETE
  FROM
    movie
  WHERE
    movie_id = ${movieId};`

  await db.run(deleteMovie)
  response.send('Movie Removed')
})

// API 6

app.get('/directors/', async (request, response) => {
  const getAllDirectorsQuery = `
  SELECT
    *
  FROM
    director;`

  const getAllDirectors = await db.all(getAllDirectorsQuery)
  response.send(
    getAllDirectors.map(eachDirector =>
      convertDirectorDbObjectToResponseObject(eachDirector),
    ),
  )
})

// API 7

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  console.log(directorId)
  const getDirectorMoviesQuery = `
  SELECT 
    movie_name
  FROM
    movie
  WHERE
    director_id = '${directorId}';`

  const getDirectorMovies = await db.all(getDirectorMoviesQuery)
  response.send(
    getDirectorMovies.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

module.exports = app
