const express = require('express')
const { MongoClient, ObjectId } = require('mongodb')
const UserDao = require('./dao-example/user-dao.js')

const app = express()

app.use(express.json())

app.use((req, res, next) => {
  console.log( `<=================== middleware ==================`);
  next()
})

let db
let userDao
(async () => {
  try {
    const client = await new MongoClient('mongodb://127.0.0.1:27017').connect()
    db = client.db('revou')
    userDao = new UserDao(db)
  } catch (error) {
    console.log(error, `<=================== error ==================`);
  }
})()

// crud
app.post('/v1/users', async (req, res) => {
  console.log(req.body, `<=================== body ==================`);
  
  const { username, email } = req.body
  
  const user = await userDao.create({ username, email })
  
  res.status(200).json({
    message: 'success',
    data: user
  })
})

app.get('/', (req, res) => {
  res.send('My App')
})

app.get('/v1/users', async (req, res) => {
  const users = await userDao.findAll()
  //find() content { is_deleted: { $exists: false }}
  //soft delete is not only for DELETE v1 users id but you should edit GET v1 users method too
  res.status(200).json({
    message: 'success',
    data: users
  })
  
})

app.put('/v1/users/:id', async (req, res) => {
  const id = req.params.id
  const { username, email } = req.body
  console.log(req.query, `<=================== query ==================`);
  
  const user = await userDao.update({id, username, email})
  
  res.status(200).json({
    message: 'success',
    data: user
  })
})

// app.delete('/v1/users/:id', async (req, res) => {
//   const { id } = req.params

//   const user = await db.collection('users').deleteOne({ _id: new ObjectId(id) })
  
//   res.status(200).json({
//     message: 'success',
//     data: user
//   })
// })

// soft delete
app.delete("/v1/users/:id",  async (req, res) => {
  const { id } = req.params;

  const user = await userDao.softDelete({ id })
  
  res.status(200).json({
    message: 'success',
  })
})

const port = 3000;

app.listen(port, () => {
  console.log(`Running on port http://localhost:${port}`)
})