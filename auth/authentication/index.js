const fs = require('fs');
const path = require('path');
const BaseAuth = require('./base');

// Get all files in the current directory
const files = fs.readdirSync(__dirname);

// Filter out the base.js file and non-JavaScript files
const authFiles = files.filter(file => file !== 'base.js' && path.extname(file) === '.js');

// Import each file as a module and instantiate it if it is a subclass of BaseAuth
const authClasses = authFiles.map(file => {
    const AuthClass = require(`./${file}`);
    if (AuthClass.prototype) {
        if (Object.getPrototypeOf(AuthClass.prototype) === BaseAuth.prototype) {
            return new AuthClass();
        }
    }
}).filter(Boolean);

module.exports = {
    async authenticate  (req, res, next) {
        for (const authClass of authClasses) {
            await authClass.authenticate(req, res, next);
        }
        next();
    }
};