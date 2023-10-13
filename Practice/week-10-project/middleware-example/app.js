// refactor
const express = require('express')
const { MongoClient} = require('mongodb')
//, ObjectId 
const userRouter = require('C:/Users/Aldi Andalan/Documents/revou/week-10-project/routes/users-routes.js')
const bookRoutes = require('C:/Users/Aldi Andalan/Documents/revou/week-10-project/routes/book-routes.js')

const app = express()

app.use(express.json())

app.use( async (req, res, next) => {
    let db
    try {
      const client = await new MongoClient('mongodb://127.0.0.1:27017').connect()
      db = client.db('revou')
    } catch (error) {
      console.log(error, `<=================== error ==================`);
    }

    req.db = db

    next()
})

app.use(express.json())
app.get('/', (req, res) => {
  res.send('My App')
})

app.use('/v1/users', (req, res, next) => {
  console.log('user middleware')
  next()
}, userRouter)

app.use('/v1/books', (req, res, next) => {
  console.log('book middleware')
  next()
}, bookRoutes)

const port = 3000;

app.listen(port, () => {
  console.log(`Running on port http://localhost:${port}`)
})