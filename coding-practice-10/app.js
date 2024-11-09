const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19IndiaPortal.db')

// console.log(dbPath)

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// Log In API

app.post('/login/', async (request, response) => {
  const {username, password} = request.body

  //console.log(username)
  //console.log(password)

  const selectUserQuery = `
    SELECT
      *
    FROM 
      user
    WHERE
      username = '${username}';
  `

  const validUser = await db.get(selectUserQuery)
  //console.log(validUser.password)

  if (validUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, validUser.password)
    //console.log(isPasswordMatched)

    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }

      const jwtToken = jwt.sign(payload, 'MY_SECRET_KEY')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

const authenticateToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  console.log(authHeader)
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }

  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_KEY', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

// API 1

app.get('/states/', authenticateToken, async (request, response) => {
  const getlistOfStatesQuery = `
  SELECT
    * 
  FROM
    state;`

  const listOfStates = await db.all(getlistOfStatesQuery)
  response.send(
    listOfStates.map(eachState =>
      convertStateDbObjectToResponseObject(eachState),
    ),
  )
})

// API 2

app.get('/states/:stateId/', authenticateToken, async (request, response) => {
  const {stateId} = request.params
  console.log(stateId)

  const getStateQuery = `
  SELECT 
    *
  FROM
    state
  WHERE 
  state_id = '${stateId}';`

  const getState = await db.get(getStateQuery)
  response.send(convertStateDbObjectToResponseObject(getState))
})

// API 3

app.post('/districts/', authenticateToken, async (request, response) => {
  const details = request.body
  const {districtName, stateId, cases, cured, active, deaths} = details
  console.log(details)
  const addDistrictQuery = `
  INSERT INTO
    district ( district_name, state_id, cases, cured, active, deaths)
  VALUES
    (
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
    );`

  await db.run(addDistrictQuery)

  response.send('District Successfully Added')
})

// API 4

app.get(
  '/districts/:districtId/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params

    const getDistrictQuery = `
  SELECT
    *
  FROM 
    district
  WHERE 
    district_id = '${districtId}';
  `

    const getDistrict = await db.get(getDistrictQuery)
    response.send(convertDistrictDbObjectToResponseObject(getDistrict))
  },
)

// API 5

app.delete(
  '/districts/:districtId/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params

    const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE 
     district_id = ${districtId};
  `

    await db.run(deleteDistrictQuery)
    response.send('District Removed')
  },
)

// API 6

app.put(
  '/districts/:districtId/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params
    const details = request.body
    const {districtName, stateId, cases, cured, active, deaths} = details
    console.log(details)

    const updateDistrictQuery = `
   UPDATE
    district
   SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
   WHERE
    district_id = ${districtId};
  `
    await db.run(updateDistrictQuery)
    response.send('District Details Updated')
  },
)

// API 7

app.get(
  '/states/:stateId/stats/',
  authenticateToken,
  async (request, response) => {
    const {stateId} = request.params
    console.log(stateId)
    const getDistrictStateQuery = `
  SELECT 
    SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
  FROM 
    district
  WHERE
    state_id = '${stateId}';
  `

    const stateArray = await db.get(getDistrictStateQuery)
    response.send(stateArray)
  },
)

// API 8

app.get(
  '/districts/:districtId/details/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params
    console.log(districtId)
    const getDistrictIdQuery = `
  SELECT 
    state_id
  FROM
    district
  WHERE
    district_id = '${districtId}';
  `

    const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)
    console.log(getDistrictIdQueryResponse)
    const getStateNameQuery = `
  SELECT
    state_name as stateName
  FROM 
    state
  WHERE
    state_id = '${getDistrictIdQueryResponse.state_id}';
  `
    const getStateNameQueryResponse = await db.get(getStateNameQuery)
    console.log(getStateNameQueryResponse)
    response.send(getStateNameQueryResponse)
  },
)

module.exports = app
