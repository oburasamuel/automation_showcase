const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory data storage (for demo purposes)
let notes = [
  { id: 1, content: 'Welcome to your notes app!', createdAt: new Date() },
  { id: 2, content: 'Click edit to modify this note', createdAt: new Date() }
];
let nextId = 3;

// Mock users
const users = [
  { id: 1, username: 'admin', password: 'password' },
  { id: 2, username: 'user', password: 'test123' }
];

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );

  res.json({ 
    token, 
    user: { id: user.id, username: user.username } 
  });
});

app.get('/api/items', authenticateToken, (req, res) => {
  res.json(notes);
});

app.post('/api/items', authenticateToken, (req, res) => {
  const { content } = req.body;
  
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required' });
  }

  const newNote = {
    id: nextId++,
    content: content.trim(),
    createdAt: new Date()
  };

  notes.push(newNote);
  res.status(201).json(newNote);
});

app.put('/api/items/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { content } = req.body;
  
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required' });
  }

  const noteIndex = notes.findIndex(note => note.id === id);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  notes[noteIndex] = {
    ...notes[noteIndex],
    content: content.trim(),
    updatedAt: new Date()
  };

  res.json(notes[noteIndex]);
});

app.delete('/api/items/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const noteIndex = notes.findIndex(note => note.id === id);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  notes.splice(noteIndex, 1);
  res.status(204).send();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };