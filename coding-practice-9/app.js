const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')

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

// Register API

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  console.log(hashedPassword)
  const selectUserQuery = `
    SELECT 
      *
    FROM
      user
    WHERE 
      username = '${username}';
  `

  const dbUser = await db.get(selectUserQuery)

  if (dbUser === undefined) {
    const addUserToDB = `
      INSERT INTO 
        user (username, name, password, gender, location)
      VALUES (
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
      );
    `

    if (password.length > 4) {
      await db.run(addUserToDB)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// Log in API

app.post('/login', async (request, response) => {
  const {username, password} = request.body

  const selectUserQuery = `
    SELECT 
      *
    FROM
      user
    WHERE 
      username = '${username}';
  `

  const dbUser = await db.get(selectUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)

    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// API 3

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const selectUserQuery = `
    SELECT 
      *
    FROM
      user
    WHERE 
      username = '${username}';
  `

  const dbUser = await db.get(selectUserQuery)

  console.log(oldPassword)
  console.log(username)
  console.log(newPassword)
  console.log(dbUser.password)

  //const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
  //console.log(isPasswordMatched)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)

    if (isPasswordMatched === true) {
      if (newPassword.length > 4) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        const updatePasswordQuery = `
        UPDATE
          user
        SET
          password = '${hashedPassword}'
        WHERE 
          username = '${username}';
      `

        const user = await db.run(updatePasswordQuery)

        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
