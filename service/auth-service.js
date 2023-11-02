const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { JWT_SIGN } = require('../config/jwt.js')
// const { verify } = require('jsonwebtoken');
const NodeCache = require('node-cache')
const { v4: uuidv4 }  = require('uuid');

const validRoles = ["maker", "approver"];
const failedLoginAttemptsCache = new NodeCache({ stdTTL: 600 });
const cacheKey = new NodeCache({ stdTTL: 300 });


// Modify register function to enforce role, non-blank username, and password requirements
const register = async (req, res) => {

  try {
      const { username, password, role } = req.body

      const userCollection = req.usersCollection;

      // if (!['maker', 'approver'].includes(role)) {
      //     throw new Error('Role must be "maker" or "approver"')
      // }

      if (!username.trim()) {
          throw new Error('Username cannot be blank')
      }
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role');
      }
      const existingUser = await userCollection.findOne({ username });
      if (existingUser) {
          throw new Error('Username is already taken');
      }
      if (password.length < 8 || !/^(?=.*\d)(?=.*[a-zA-Z]).+$/.test(password)) {
          throw new Error('Password must be at least 8 characters and contain both letters and numbers')
      }
      // !password.match(/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/)
      // const user = await req.db.collection('users').findOne({ username })

      // if (user) {
      //     throw new Error('Username already exists')
      // }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await userCollection.insertOne({
        username,
        password: hashedPassword,
        role,
      });
      res.status(200).json({
          success: true,
          message: 'User successfully registered',
          data: newUser
      })
  } catch (error) {
      res.status(400).json({ success: false, error: error.message })
  }
}

// const newUser = await req.db.collection('users').insertOne({ username, password: hashedPassword, role })
// res.status(200).json({
//   data: { _id: newUser.insertedId },
// });

const login = async (req, res) => {

    const { usersCollection } = req;
    const { username, password } = req.body

    const loginAttempts = failedLoginAttemptsCache.get(username) || 1;
    console.log(loginAttempts, "failed login attemps");

    if (loginAttempts >= 3) {
      return res.status(429).json({
        success: false,
        message: "Too many failed login attempts. Please try again later.",
      });
    }
    //req.db.collection('users')
    try { 
      const user = await usersCollection.findOne({ username })
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
        const JWT_SIGN = process.env.JWT_SIGN;
  
        if (!JWT_SIGN) throw new Error("JWT_SIGN is not defined");
  
        const accessTokenExpiration = addDays(new Date(), 300);
        const accessToken = jwt.sign(
          { username: user.username, id: user._id, role: user.role },
          JWT_SIGN,
          { expiresIn: "5m" }
        );
        const refreshTokenPayload = {
          username: user.username,
          id: user._id,
          role: user.role,
        };
        // const expireAt = Math.floor(Date.now() / 1000) + (60 * 60) //change
        // const token = jwt.sign(
        //   { username: user.username, id: user._id, role: user.role }, 
        //   JWT_SIGN, { expiresIn: expireAt } //change
        // );
        const refreshToken = jwt.sign(
          refreshTokenPayload,
          JWT_SIGN, {
            expiresIn: '7d',
          });

        failedLoginAttemptsCache.del(username);
        
        res.cookie("access_token", accessToken, {
          maxAge: 5 * 60 * 1000,
          httpOnly: true,
        });
        // res.cookie("token", token, { 60 *
        //   maxAge: 5 * 60 * 1000,
        //   httpOnly: true,
        // });
        res.cookie("refresh_token", refreshToken, {
          maxAge: 5 * 24 * 60 * 60 * 1000, 
          httpOnly: true,
        });

        return res.status(200).json({
          success: true,
          message: {
            accessToken,
            refreshToken,
            accessTokenExpiration,
          },
          // message: 'User successfully logged in',
          // data: {
          //   token: token,
          //   refreshToken: refreshToken, //change
          //   expireAt: expireAt //change
          // }
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
  const refreshToken = req.cookies?.refresh_token;
  console.log(refreshToken, "refresh_token");

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "refresh token is missing"
    })
  }

  if (!JWT_SIGN) throw new Error('JWT_SIGN is not defined')
    const decodedRefreshToken = jwt.verify(refreshToken, JWT_SIGN)
  console.log(decodedRefreshToken)
  res.status(200)
// JWT_SIGN, "jwtsign"

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

    if (refreshToken) {
      const accessToken = jwt.sign(decodedRefreshToken, JWT_SIGN)
    // const accessToken= jwt.sign({userId: decodedRefreshToken.userId}, JWT_SIGN, {expiresIn: "10m",})

    res.cookie("access_token", accessToken, {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
    })

    return res.status(200).json({
      success: true,
      message: "access token refresh successfully",
      data: { accessToken }
    })
  }
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
  // const { usersCollection } = req.db; db.collection('users')

  try {
    const user = await req.usersCollection.findOne({ username })

    if (!user) {
      throw {
        status: 404,
        message: "User not found.",
        success: false,
      }
    }
    const tokenResetPassword = uuidv4();

    cacheKey.set(tokenResetPassword, username, 900);
    return res.status(200).json({
      success: true,
      message: "reset password link has been sent",
      data: tokenResetPassword,
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    // return res.status(error.status || 500).json({
    //   success: false,
    //   message: error.message || 'internal server error'
    })
  }
};

const resetPassword = async (req, res, next) => {
  const { token } = req.query;
  const { newPassword } = req.body;
  console.log('Request Query:', req.query);
  console.log('Request Body:', req.body);

  try {
    if(!token || typeof token !== 'string' || typeof newPassword !== 'string') {
      throw new Error('token or new password is not string')
    }

    const username = cacheKey.get(token);
    console.log('Username retrieved from cache:', username);

    if(!username) {
      throw {
        success: false,
        status: 401,
        message: "invalid or expired token",
      }
    }
    
    const user = await req.usersCollection.findOne({ username });

    if (!user) {
    res.status(400).json({ error: "User not found" });
    return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // db.collection
    await req.usersCollection.findOneAndUpdate({ username }, { $set: { password: hashedPassword}});

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