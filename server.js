const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

app.get('/download', (req, res) => {
  const size = 1024 * 1024; // 1 MB
  const data = Buffer.alloc(size, 'a');

  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(data);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});