const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { JWT_SIGN } = require('../config/jwt.js')
// const { verify } = require('jsonwebtoken');
const NodeCache = require('node-cache')
const { uuid }  = require('uuid-v4');

const failedLoginAttemptsCache = new NodeCache({ stdTTL: 600 });
const cacheKey = new NodeCache({ stdTTL: 300 });


// Modify register function to enforce role, non-blank username, and password requirements
const register = async (req, res) => {
  const { username, password, role } = req.body

  try {
      if (!['maker', 'approver'].includes(role)) {
          throw new Error('Role must be "maker" or "approver"')
      }
      if (!username.trim()) {
          throw new Error('Username cannot be blank')
      }
      if (password.length < 8 || !/^(?=.*\d)(?=.*[a-zA-Z]).+$/.test(password)) {
          throw new Error('Password must be at least 8 characters and contain both letters and numbers')
      }

      const user = await req.db.collection('users').findOne({ username })

      if (user) {
          throw new Error('Username already exists')
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await req.db.collection('users').insertOne({ username, password: hashedPassword, role })
      res.status(200).json({
          message: 'User successfully registered',
          data: newUser
      })
  } catch (error) {
      res.status(400).json({ error: error.message })
  }
}


const login = async (req, res) => {
    const { username, password } = req.body

    const loginAttempts = failedLoginAttemptsCache.get(username) || 1;
    console.log(loginAttempts, "failed login attemps");

    if (loginAttempts >= 3) {
      return res.status(429).json({
        success: false,
        message: "Too many failed login attempts. Please try again later.",
      });
    }

    try { 
      const user = await req.db.collection('users').findOne({ username })
      if (!user) {
        failedLoginAttemptsCache.set(username, loginAttempts + 1);
        throw ({
          success: false,
          message: "Incorrect username or password. Please try again.",
          status: 401,
        });
      } 

      const isPasswordCorrect = await bcrypt.compare(password, user.password) 
    
      if (isPasswordCorrect) {
        const expireAt = Math.floor(Date.now() / 1000) + (60 * 60) //change
        const token = jwt.sign(
          { username: user.username, id: user._id, role: user.role }, 
          JWT_SIGN, { expiresIn: expireAt } //change
        );
        const refreshToken = jwt.sign(
          { username: user.username, id: user._id, role: user.role },
          JWT_SIGN, {expiresIn: '7d'}
        );

        failedLoginAttemptsCache.del(username);
        
        res.cookie("expireAt", expireAt, {
          maxAge: 5 * 60 * 60 * 1000,
          httpOnly: true,
        });
        res.cookie("token", token, {
          maxAge: 5 * 60 * 1000,
          httpOnly: true,
        });
        res.cookie("refreshToken", refreshToken, {
          maxAge: 5 * 24 * 60 * 60 * 1000, 
          httpOnly: true,
        });

        return res.status(200).json({
          message: 'User successfully logged in',
          data: {
            token: token,
            refreshToken: refreshToken, //change
            expireAt: expireAt //change
          }
        })
      } else {
        failedLoginAttemptsCache.set(username, loginAttempts + 1);
        throw ({
          success: false,
          message: "Username or password is incorrect. Please try again.",
          status: 401,
        });
      }
    } catch (error) {
        console.log(error);
    
        if (error.status === 401) {
          return res.status(401).json({
            success: false,
            message: error.message,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal server error",
          });
        }
    }
}

const refreshAccessToken = async (req, res, next) => {
  const refreshToken = req.cookies['refreshToken'];
  console.log(refreshToken, "refreshToken");

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "refresh token is missing"
    })
  }

  if (!JWT_SIGN) throw new Error('JWT_SIGN is not defined')
  const decodedRefreshToken = jwt.verify(refreshToken, JWT_SIGN)
  console.log(JWT_SIGN, "jwtsign")
  res.status(200)
//decodedRefreshToken

  try {
    if (
      !decodedRefreshToken || !decodedRefreshToken.exp 
    ) {
      throw {
        success: false,
        status: 401,
        message: 'Refresh token is invalid or has expired. Please login again',
      }
    }

    if (decodedRefreshToken.exp < Date.now() / 1000) {
      throw {
        success: false,
        status: 401,
        message: "Refresh token has expired. Please login again"
      }
    }

    const accessToken= jwt.sign({userId: decodedRefreshToken.userId}, JWT_SIGN, {
      expiresIn: "10m",
    })

    res.cookie("access_token", accessToken, {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
    })

    return res.status(200).json({
      success: true,
      message: "access token refresh successfully",
      data: { accessToken }
    })

  } catch (error) {
    next(error)
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return res.status(200).json({
      success: true,
      message: "Successfully logout",
    });
  } catch (error) {
    next(error);
  }
};

const requestResetPassword = async (req, res) => {
  const { username } = req.body;

  try {
    const user = await usersCollection.findOne({ username })

    if (!user) {
      throw {
        status: 404,
        message: "User not found.",
        success: false,
      }
    }
    const tokenResetPassword = uuid();

    cacheKey.set(tokenResetPassword, username, 900);
    return res.status(200).json({
      success: true,
      message: "reset password link has been sent",
      data: tokenResetPassword,
    })
  } catch {error} {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'internal server error'
    })
  }
};

const resetPassword = async (req, res, next) => {
  const { token } = req.query;
  const { newPassword } = req.body;

  try {
    if(typeof token !== 'string' || typeof newPassword !== 'string') {
      throw new Error('token or new password is not string')
    }

    const username = cacheKey.get(token);
    if(!username) {
      throw {
        success: false,
        status: 401,
        message: "invalid or expired token",
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userCollection.findOneAndUpdate({username}, { $set: { password: hashedPassword}});

    cacheKey.del(token);

    return res.status(200).json({
      success: true,
      message: "password reset successfully",
    });

  } catch (error) {
    console.error(error);
    next(error)
  }
}


module.exports = {
    register,
    login,
    refreshAccessToken,
    requestResetPassword,
    resetPassword,
    logout
}