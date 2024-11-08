const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

dbPath = path.join(__dirname, 'cricketMatchDetails.db')

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

// API 1

app.get('/players/', async (request, response) => {
  const listOfPlayerQuery = `
    SELECT 
      player_id as playerId,
      player_name as playerName
    FROM 
      player_details;
    `

  const listOfPlayers = await db.all(listOfPlayerQuery)
  response.send(listOfPlayers)
})

// API 2

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  console.log(playerId)
  const getPlayerQuery = `
    SELECT 
      player_id as playerId,
      player_name as playerName
    FROM 
      player_details
    WHERE
      player_id = '${playerId}';
    `

  const getPlayer = await db.get(getPlayerQuery)
  response.send(getPlayer)
})

// API 3

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  console.log(playerId)

  const {playerName} = request.body
  console.log(playerName)

  const updatePlayerQuery = `
  UPDATE 
    player_details
  SET 
    player_name = '${playerName}'
  WHERE
    player_id = '${playerId}';
  `

  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

// API 4

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params

  const getMatchQuery = `
    SELECT
      match_id as matchId,
      match,
      year
    FROM 
      match_details
    WHERE
      match_id = '${matchId}';
   `

  const getMatch = await db.get(getMatchQuery)
  response.send(getMatch)
})

// API 5

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params

  const getPlayerMatchQuery = `
   SELECT
    match_id as matchId,
    match,
    year
  FROM
    player_match_score NATURAL JOIN match_details
  WHERE
    player_id = '${playerId}';
  `

  const getPlayerMatch = await db.all(getPlayerMatchQuery)
  response.send(getPlayerMatch)
})

// API 6

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params

  const matchPlayerQuery = `
  SELECT
    player_match_score.player_id as playerId,
    player_name as playerName
  FROM 
    player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
  WHERE
    match_id = '${matchId}';
  `

  const getMatchPlayer = await db.all(matchPlayerQuery)
  response.send(getMatchPlayer)
})

// API 7

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params

  const getPlayerScoreQuery = `
  SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
  FROM 
    player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
  WHERE
    player_details.player_id = ${playerId};
  `

  const getPlayerScore = await db.get(getPlayerScoreQuery)
  response.send(getPlayerScore)
})

module.exports = app
