// app.js
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session for storing API credentials temporarily
app.use(session({
  secret: process.env.SESSION_SECRET || 'bunnycdn-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    config: {
      libraryId: req.session.libraryId || '',
      accessKey: req.session.accessKey || '',
      collection: req.session.collection || ''
    }
  });
});

// Save config to session
app.post('/api/config', (req, res) => {
  const { libraryId, accessKey, collection } = req.body;
  
  req.session.libraryId = libraryId;
  req.session.accessKey = accessKey;
  req.session.collection = collection;
  
  res.json({ success: true });
});

app.get('/api/videos', async (req, res) => {
  try {
    // Get credentials from session
    const libraryId = req.session.libraryId;
    const accessKey = req.session.accessKey;
    const collection = req.session.collection || '';
    
    // Check if credentials are set
    if (!libraryId || !accessKey) {
      return res.status(400).json({ error: 'API credentials not configured. Please set them in the configuration section.' });
    }
    
    const page = req.query.page || 1;
    const itemsPerPage = 100; // Fixed at 100 items per page
    
    let url = `https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`;
    
    // Add collection filter if provided
    if (collection) {
      url += `&collection=${collection}`;
    }
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'AccessKey': accessKey
      }
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: `Failed to fetch videos: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});