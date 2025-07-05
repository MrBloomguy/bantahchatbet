const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Telegram Auth Endpoint
app.post('/api/telegram-auth', (req, res) => {
  const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

  // Verify the data integrity
  const secretKey = crypto.createHash('sha256').update('YOUR_BOT_TOKEN').digest();
  const dataCheckString = Object.keys(req.body)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${req.body[key]}`)
    .join('\n');

  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (hmac !== hash) {
    return res.status(403).json({ success: false, message: 'Data verification failed' });
  }

  // Save user data to the database (mocked for now)
  const user = {
    id,
    first_name,
    last_name,
    username,
    photo_url,
    auth_date,
  };

  console.log('Authenticated user:', user);

  // Respond with success
  res.json({ success: true, message: 'Authentication successful', user });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});