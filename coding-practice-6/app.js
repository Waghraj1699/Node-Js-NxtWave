const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

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
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

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

app.get('/states/', async (request, response) => {
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

app.get('/states/:stateId/', async (request, response) => {
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

app.post('/districts/', async (request, response) => {
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

app.get('/districts/:districtId/', async (request, response) => {
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
})

// API 5

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE 
     district_id = ${districtId};
  `

  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

// API 6

app.put('/districts/:districtId/', async (request, response) => {
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
})

// API 7

app.get('/states/:stateId/stats/', async (request, response) => {
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
})

// API 8

app.get('/districts/:districtId/details/', async (request, response) => {
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
})

module.exports = app
