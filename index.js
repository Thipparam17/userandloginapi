const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// Get Books API
app.get('/books/', async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})

//create user api
app.post('/users/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedpassword = await bcrypt.hash(password, 10)
  const selectquery = `select * from user where username='${username}'`
  const dbuser = await db.get(selectquery)
  if (dbuser === undefined) {
    const insertquery = `insert into user (username,name,password,gender,location)
     values (
      '${username}',
      '${name}',
      '${hashedpassword}',
      '${gender}',
      '${location}'
     )
     `
    await db.run(insertquery)
    response.send('updated successfully')
  } else {
    response.status(400)
    response.send('user aleady exist')
  }
})

//login user api
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}'`
  const dbuser = await db.get(selectUserQuery)

  if (dbuser === undefined) {
    response.status(400)
    response.send('invalid user')
  } else {
    const ispasswordmatched = await bcrypt.compare(password, dbuser.password)
    if (ispasswordmatched === true) {
      response.send('login success')
    } else {
      response.status(400)
      response.send('invalid password')
    }
  }
})
