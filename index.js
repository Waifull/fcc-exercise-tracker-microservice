const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// In-memory data storage
let users = []; // Array of { username, _id }
let exercises = {}; // { userId: [ { description, duration, date } ] }

// Helper function to generate unique IDs (simple)
const generateId = () => Date.now().toString() + Math.floor(Math.random() * 1000).toString();

// Root endpoint (optional)
app.get('/', (req, res) => {
  res.send('Exercise Tracker API');
});

// 1. Create new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  // Check if username already exists (optional)
  const existingUser = users.find(u => u.username === username);
  if (existingUser) return res.json(existingUser);

  const _id = generateId();
  const newUser = { username, _id };
  users.push(newUser);
  exercises[_id] = [];
  res.json(newUser);
});

// 2. Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 3. Add exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { description, duration, date } = req.body;
  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const durationNum = parseInt(duration);
  if (isNaN(durationNum)) {
    return res.status(400).json({ error: 'Duration must be a number' });
  }

  let exerciseDate;
  if (date) {
    exerciseDate = new Date(date);
    if (exerciseDate.toString() === 'Invalid Date') {
      return res.status(400).json({ error: 'Invalid date format' });
    }
  } else {
    exerciseDate = new Date();
  }

  const exercise = {
    description: description.toString(),
    duration: durationNum,
    date: exerciseDate.toDateString()
  };

  exercises[userId].push(exercise);

  res.json({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});

// 4. Get user logs with optional filters
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let log = exercises[userId] || [];

  // Filter by from
  if (req.query.from) {
    const fromDate = new Date(req.query.from);
    if (fromDate.toString() === 'Invalid Date') {
      return res.status(400).json({ error: 'Invalid from date' });
    }
    log = log.filter(e => new Date(e.date) >= fromDate);
  }

  // Filter by to
  if (req.query.to) {
    const toDate = new Date(req.query.to);
    if (toDate.toString() === 'Invalid Date') {
      return res.status(400).json({ error: 'Invalid to date' });
    }
    log = log.filter(e => new Date(e.date) <= toDate);
  }

  // Limit results
  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ error: 'Limit must be a positive number' });
    }
    log = log.slice(0, limit);
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toString() 
    }))
  });
});

// Set port and start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Exercise Tracker app listening on port ${PORT}`);
});
