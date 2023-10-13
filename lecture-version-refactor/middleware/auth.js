const auth = require("../authentication");
module.exports = (app) => {
    // Parse incoming request bodies in a middleware before your handlers, available under the req.body property
    app.use(auth.authenticate);
  }