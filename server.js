const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  res.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

app.get('/download', (req, res) => {
  const sizeMb = Number(req.query.size) || 10;
  const size = sizeMb * 1024 * 1024;
  const data = Buffer.alloc(size, 'a');

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(data);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});