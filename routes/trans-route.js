const { Router } = require('express')
const { getAllTrans, createTrans, approvalTrans, deleteTrans } = require('../service/trans-service.js')
const authorizationMiddleware = require('../middleware/authorization-middleware.js')

const transRouter = Router()

transRouter.get('/', authorizationMiddleware, getAllTrans)
transRouter.post('/new', authorizationMiddleware, createTrans)
transRouter.put('/:id', authorizationMiddleware, approvalTrans)
transRouter.delete('/del/:id', authorizationMiddleware, deleteTrans)

module.exports = transRouter