const express = require('express')
const { MongoClient, ObjectId } = require('mongodb')

const app = express()

app.use(express.json())

app.use((req, res, next) => {
  console.log( `<=================== middleware ==================`);
  next()
})

let db
(async () => {
  try {
    const client = await new MongoClient('mongodb://127.0.0.1:27017').connect()
    db = client.db('revou')
  } catch (error) {
    console.log(error, `<=================== error ==================`);
  }
})()
//
// crud
app.post('/v1/users', async (req, res) => {
  console.log(req.body, `<=================== body ==================`);
  
  const { username, email } = req.body
  
  const user = await db.collection('users').insertOne({ username, email })
  
  res.status(200).json({
    message: 'success',
    data: user
  })
})

app.get('/', (req, res) => {
  res.send('My App')
})

app.get('/v1/users', async (req, res) => {
  const users = await db.collection('users').find({ is_deleted: { $exists: false }}).toArray()
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
  
  const user = await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: { username, email } })
  
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

  const user = await db.collection('users').findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { is_deleted: true } })
  
  res.status(200).json({
    message: 'success',
  })
})

const port = 3000;

app.listen(port, () => {
  console.log(`Running on port http://localhost:${port}`)
})