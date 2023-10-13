const User = require("../models/User");
const BaseAuth = require("./base");
// Authentication using JWT
class JWTAuth extends BaseAuth {
    // {
    //     "Authoriazation" : "Bearer <token>"
    // }
    async getUser(req) {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            if (token) {
                const _user = await User.parseTokenSafe(token);
                if (!_user) return null;
                return _user;
            }
        }
        return null;
    }
}
module.exports = JWTAuth;