const jwt = require('jsonwebtoken')
const { JWT_SIGN } = require('../config/jwt.js')

const authenticationMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization

    console.log(authHeader, '------------ authHeader')

    if (!authHeader) {
        res.status(401).json({ error: "Unauthorized"})
    } else {
        const token = authHeader.split(' ')[1]

        try {
        const decodedToken = jwt.verify(token, JWT_SIGN)
        console.log(decodedToken, 'decodedToken');
        next()
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
        //const token = authHeader.split(' ')[1]
    }
}

module.exports = authenticationMiddleware