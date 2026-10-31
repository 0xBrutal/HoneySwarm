const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const registerUser = (req, res) => {
  const { name, email, password } = req.body;
  const db = req.app.get('db');

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  const userExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // Create user (Default role is defender)
  const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  const info = stmt.run(name, email, hashedPassword, 'defender');

  const user = { id: info.lastInsertRowid, name, email, role: 'defender' };

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user.id),
  });
};

const loginUser = (req, res) => {
  const { email, password } = req.body;
  const db = req.app.get('db');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (user && bcrypt.compareSync(password, user.password_hash)) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

const getMe = (req, res) => {
  // req.user is attached by the protect middleware
  res.status(200).json(req.user);
};

module.exports = { registerUser, loginUser, getMe };
