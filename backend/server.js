const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// In-memory store (replace with DB in production)
const users = new Map();

// Helper to create user object
function createUser(id, { username, email, fullName }) {
  return {
    id,
    username,
    email,
    fullName: fullName || username,
    profileImage: '/default-avatar.png',
    bio: '',
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt: new Date().toISOString()
  };
}

// Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, fullName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email and password are required'
    });
  }
  if (users.has(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }
  const id = `user-${Date.now()}`;
  const user = createUser(id, { username, email, fullName });
  users.set(email, { ...user, password });
  const token = `token-${id}-${Date.now()}`;
  res.status(201).json({ success: true, token, user });
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  const stored = users.get(email);
  if (!stored || stored.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
  const { password: _, ...user } = stored;
  const token = `token-${user.id}-${Date.now()}`;
  res.json({ success: true, token, user });
});

// Auth: Get current user (requires Bearer token)
app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const token = auth.slice(7);
  const userId = token.split('-')[1];
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  const stored = [...users.values()].find(u => u.id === userId);
  if (!stored) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }
  const { password: _, ...user } = stored;
  res.json({ success: true, user });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}/api`);
});
