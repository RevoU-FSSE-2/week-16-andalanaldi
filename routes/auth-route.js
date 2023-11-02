const { Router } = require('express')
const { register, login, refreshAccessToken, requestResetPassword, resetPassword, logout } = require('../service/auth-service.js')

const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/refresh-token', refreshAccessToken)
authRouter.post('/reset-password/request', requestResetPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.post('/logout', logout)

module.exports = authRouter