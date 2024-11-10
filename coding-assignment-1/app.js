const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')

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
      console.log('success')
    })
  } catch (error) {
    console.log(`DB error : ${error}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndStatusProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasDueDateProperty = requestQuery => {
  return requestQuery.dueDate !== undefined
}

const isValidTodoPriority = item => {
  if (item === 'HIGH' || item === 'MEDIUM' || item === 'LOW') {
    return true
  } else {
    return false
  }
}

const isValidTodoCategory = item => {
  if (item === 'HOME' || item === 'WORK' || item === 'LEARNING') {
    return true
  } else {
    return false
  }
}

const isValidTodoStatus = item => {
  if (item === 'TO DO' || item === 'IN PROGRESS' || item === 'DONE') {
    return true
  } else {
    return false
  }
}

const isValidTodoDueDate = item => {
  return isValid(new Date(item))
}

const convertDueDate = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}

// API 1

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    // GET http://localhost:3000/todos/?priority=HIGH&status=IN%20PROGRESS

    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
        SELECT
          * 
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}';`
      if (isValidTodoPriority(priority) && isValidTodoStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else if (isValidTodoPriority(priority)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    // GET http://localhost:3000/todos/?category=WORK&status=DONE

    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `
        SELECT
          * 
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND category = '${category}';`
      if (isValidTodoCategory(category) && isValidTodoStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else if (isValidTodoCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    // GET http://localhost:3000/todos/?category=LEARNING&priority=HIGH

    case hasCategoryAndPriorityProperties(request.query):
      getTodoQuery = `
        SELECT
          * 
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND category = '${category}'
          AND priority = '${priority}';`
      if (isValidTodoPriority(priority) && isValidTodoPriority(priority)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else if (isValidTodoCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    // GET http://localhost:3000/todos/?category=HOME

    case hasCategoryProperty(request.query):
      getTodoQuery = `
        SELECT
          * 
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND category = '${category}';`
      if (isValidTodoCategory(category)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    // GET http://localhost:3000/todos/?priority=HIGH

    case hasPriorityProperty(request.query):
      getTodoQuery = `
        SELECT
          * 
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`
      if (isValidTodoPriority(priority)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    // GET http://localhost:3000/todos/?status=TO%20DO

    case hasStatusProperty(request.query):
      console.log(status)
      getTodoQuery = `
        SELECT
          * 
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`
      if (isValidTodoStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    // GET http://localhost:3000/todos/?search_q=Buy
    default:
      getTodoQuery = `
        SELECT
          * 
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%';
        `
      data = await db.all(getTodoQuery)
      response.send(data.map(object => convertDueDate(object)))
  }
})

// API 2

app.get('/todos/:todoId/', async (request, response) => {
  // GET http://localhost:3000/todos/6

  const {todoId} = request.params
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = '${todoId}';
  `
  const data = await db.get(getTodoQuery)
  response.send(convertDueDate(data))
})

// API 3

app.get('/agenda/', async (request, response) => {
  // GET http://localhost:3000/agenda/?date=2021-04-04

  const {date} = request.query
  console.log(date)
  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    if (isValidTodoDueDate(date)) {
      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formatedDate)
      const getTodoQuery = `
        SELECT
          *
        FROM
          todo
        WHERE 
          due_date = '${formatedDate}';
      `
      const data = await db.all(getTodoQuery)
      console.log(data)
      response.send(data.map(object => convertDueDate(object)))
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

// API 4

app.post('/todos/', async (request, response) => {
  /*
  POST http://localhost:3000/todos/
Content-Type: application/json

{
  "id": 6,
  "todo": "Finalize event theme",
  "priority": "LOW",
  "status": "TO DO",
  "category": "HOME",
  "dueDate": "2021-02-22"
}
*/
  const todoDetails = request.body
  const {id, todo, priority, status, dueDate, category} = todoDetails

  switch (false) {
    case isValidTodoPriority(priority):
      response.status(400)
      response.send('Invalid Todo Priority')
      break

    case isValidTodoCategory(category):
      response.status(400)
      response.send('Invalid Todo Category')
      break

    case isValidTodoStatus(status):
      response.status(400)
      response.send('Invalid Todo Status')
      break

    case isValidTodoDueDate(dueDate):
      response.status(400)
      response.send('Invalid Due Date')
      break

    default:
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(request.body)
      const addTodoQuery = `
        INSERT INTO 
          todo (id,todo,priority,status,category,due_date)
        VALUES (
          '${id}',
          '${todo}',
          '${priority}',
          '${status}',
          '${category}',
          '${formatedDate}'
        );
      `
      const dbResponse = await db.run(addTodoQuery)
      response.send('Todo Successfully Added')
      break
  }
})

// API 5

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoDetails = request.body
  const {todo, priority, status, dueDate, category} = todoDetails
  let updateTodoquery = ''
  switch (true) {
    case hasStatusProperty(request.body):
      updateTodoquery = `
        UPDATE 
          todo
        SET
          status = '${status}'
        WHERE
          id = '${todoId}';
      `
      if (isValidTodoStatus(status)) {
        await db.run(updateTodoquery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasPriorityProperty(request.body):
      updateTodoquery = `
        UPDATE 
          todo
        SET
          priority = '${priority}'
        WHERE
          id = '${todoId}';
      `
      if (isValidTodoPriority(priority)) {
        await db.run(updateTodoquery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryProperty(request.body):
      updateTodoquery = `
        UPDATE 
          todo
        SET
          category = '${category}'
        WHERE
          id = '${todoId}';
      `
      if (isValidTodoCategory(category)) {
        await db.run(updateTodoquery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasDueDateProperty(request.body):
      updateTodoquery = `
        UPDATE 
          todo
        SET
          due_date = '${dueDate}'
        WHERE
          id = '${todoId}';
      `
      if (isValidTodoDueDate(dueDate)) {
        await db.run(updateTodoquery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    default:
      updateTodoquery = `
        UPDATE 
          todo
        SET
          todo = '${todo}'
        WHERE
          id = '${todoId}';
      `
      await db.run(updateTodoquery)
      response.send('Todo Updated')
      break
  }
})

// API 6

app.delete('/todos/:todoId/', async (request, response) => {
  // DELETE http://localhost:3000/todos/2

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
