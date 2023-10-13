const User = require('../models/User');
const cache = require('memory-cache');

const sendEmail = (email, key) => {
    console.log(`Subject: Password reset request`);
    console.log(`To: ${email}`);
    console.log(`Body: hit me, http://localhost:3000/reset?key=${key}`);
  
  };

exports.login_session = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.get({ username: username });
    const isAuth = await User.authenticate(user.username, password);
    if (!user || !isAuth) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    const { accesToken, expireAt, refreshToken } = User.generateToken(user);
    res.cookie('accesToken', accesToken, { httpOnly: true, expire: expireAt });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, expire: expireAt });
    res.json();
  };
  
  exports.logout_session = async (req, res) => {
    res.clearCookie('accesToken');
    res.clearCookie('refreshToken');
    res.json();
  };

  exports.passwordResetRequest = async (req, res) => {
    // untuk minta kunci reset password
    const { email } = req.body;
    const user = await User.get({ email: email });
    if (!user) {
      res.status(400).json({ error: "some error" });
      return;
    }
    const key = Math.random().toString(36).substring(2, 15);
    // set cache 5 minutes
    cache.put(key, user.email, 25 * 1 * 1000);
    sendEmail(user.email, key);
    res.json({ message: "Password reset email sent" });
  };
  
  exports.passwordReset = async (req, res) => {
    const { password } = req.body;
    const { key } = req.query;
    const email = cache.get(key); // if expired this is null
    console.log(key);
    console.log(email)
    console.log(cache.keys());
    if (!email) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }
    const user = await User.get({ email: email });
    if (!user) {
      res.status(400).json({ error: "error" });
      return;
    }
  
    await user.updateOne({ password: User.make_password(password) });
    // jika sukses kunci dihapus
    cache.del(key);
    res.json({ message: "Password reset success" });
  };