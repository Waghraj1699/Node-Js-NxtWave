/* 

Created table with name todo in the todoApplication.db with the CLI using sqlite3 todoApplication.db command

CREATE TABLE todo (id INTEGER, todo TEXT, priority TEXT, status TEXT);

INSERT INTO todo (id, todo, priority, status)
VALUES 
    (1,"Learn HTML","HIGH","TO DO"),
    (2,"Learn JS","MEDIUM","DONE"),
    (3,"Learn CSS","LOW","DONE"),
    (4,"Play Cricket","LOW","DONE");
    
SELECT * FROM todo;

*/
const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

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

const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

// API 1

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM 
        todo
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`
      break

    case hasPriorityProperty(request.query):
      getTodoQuery = `
        SELECT
        *
      FROM 
        todo
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`
      break

    case hasStatusProperty(request.query):
      getTodoQuery = `
        SELECT
        *
      FROM 
        todo
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`
      break

    default:
      getTodoQuery = `
        SELECT
          *
        FROM 
          todo
        WHERE
          todo LIKE '%${search_q}%';`
      break
  }

  data = await db.all(getTodoQuery)
  response.send(data)
})

// API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  console.log(todoId)
  const getTodoQuery = `
  SELECT
    *
  FROM 
    todo
  WHERE
    id = '${todoId}';`

  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

// API 3

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body

  const postTodoQuery = `
  INSERT INTO
    todo (id,todo,priority,status)
  VALUES
    (${id},'${todo}','${priority}','${status}');`

  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

// API 4

app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''

  const requestBody = request.body

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }

  const previousTodoQuery = `
  SELECT 
    * 
  FROM
    todo
  WHERE
    id = '${todoId}';
  `

  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = requestBody

  const updateTodoQuery = `
    UPDATE 
      todo
    SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE
      id = '${todoId}';
  `
  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

// API 5

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = '${todoId}';
  `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
