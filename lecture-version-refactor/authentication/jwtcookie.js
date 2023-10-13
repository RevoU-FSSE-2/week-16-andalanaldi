const User = require("../models/User");
const BaseAuth = require("./base");
// Authentication using JWT
class JWTAuthCookies extends BaseAuth {
    // {
    //     "Authoriazation" : "Bearer <token>"
    // }
    async getUser(req) {
        const token = req.cookies?.accesToken;
        if (token) {
            const _user = await User.parseTokenSafe(token);
            if (!_user) return null;
            return _user;
        }
        return null;
    }
}
module.exports = JWTAuthCookies;