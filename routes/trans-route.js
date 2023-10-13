const { Router } = require('express')
const { getAllTrans, createTrans, approvalTrans } = require('../service/trans-service.js')
const authorizationMiddleware = require('../middleware/authorization-middleware.js')

const transRouter = Router()

transRouter.get('/', getAllTrans)
transRouter.post('/', createTrans)
transRouter.put('/:id', authorizationMiddleware, approvalTrans)

module.exports = transRouter