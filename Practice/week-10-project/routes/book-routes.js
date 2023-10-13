const { Router } = require('express')

const bookRouter = Router()

bookRouter.use((req, res, next) => {
    console.log('book middleware')
    next()
  })
// create read 
bookRouter.post('/', async (req, res) => {
    const { title, author } = req.body
    
    const book = await req.db.collection('books').insertOne({ title, author })
    
    res.status(200).json({
      message: 'success',
      data: book
    })
  })

bookRouter.get('/', async (req, res) => {
    const books = await req.db.collection('books').find({ is_deleted: { $exists: false }}).toArray()
    
    res.status(200).json({
      message: 'success',
      data: books
    })
  })

module.exports = bookRouter