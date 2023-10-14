require('dotenv').config()

const express = require('express')
const databaseMiddleware = require('./middleware/database-middleware.js')
const authRouter = require('./routes/auth-route.js')
const transRouter = require('./routes/trans-route.js')
const authMiddleware = require('./middleware/authentication-middleware.js')
// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./doc/openapi.yaml');
//C:\Users\Aldi Andalan\Documents\revou\week-10-project2\authentication-example\doc
// const yaml = require('yaml')
// const fs = require('fs')
// const OpenApiValidator = require('express-openapi-validator');

// const openApiPath = './doc/openapi.yaml'
// const file = fs.readFileSync(openApiPath, 'utf8')
// const swaggerDocument = yaml.parse(file)

const app = express()

app.use(express.json())
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.use(OpenApiValidator.middleware({
//     apiSpec: openApiPath,
//     validateRequests: true,
//   }))
app.use(databaseMiddleware)

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.use('/auth', authRouter)
app.use('/trans', authMiddleware, transRouter)

app.use((err, req, res, next) => {
    console.log(err, `<===== error =====`);
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors
    })
  })

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})
