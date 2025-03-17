// app.js
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/videos', async (req, res) => {
  try {
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const accessKey = process.env.BUNNY_ACCESS_KEY;
    const collection = process.env.BUNNY_COLLECTION || '';
    
    const page = req.query.page || 1;
    const itemsPerPage = req.query.itemsPerPage || 100;

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
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});