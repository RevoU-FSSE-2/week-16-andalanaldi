const { Router } = require('express')
const { getAllTrans, createTrans, approvalTrans, deleteTrans } = require('../service/trans-service.js')
const authorizationMiddleware = require('../middleware/authorization-middleware.js')

const transRouter = Router()

transRouter.get('/trans', authorizationMiddleware, getAllTrans)
transRouter.post('/trans/new', authorizationMiddleware, createTrans)
transRouter.put('/trans/:id', authorizationMiddleware, approvalTrans)
transRouter.delete('/trans/del/:id', authorizationMiddleware, deleteTrans)

module.exports = transRouter