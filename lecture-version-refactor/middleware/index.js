const applyHelmet = require('./helmet');
const applyBodyParser = require('./bodyParser');
const applyMorgan = require('./morgan');
const applyAuth = require('./auth');
const applyCookieParser = require('./cookieparser');

module.exports = (app) => {
  applyHelmet(app);
  applyBodyParser(app);
  applyMorgan(app);
  applyCookieParser(app);
  applyAuth(app);
}
