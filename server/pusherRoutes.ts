
import { Router } from 'express';
import { pusher } from './pusher';

const router = Router();

// Pusher authentication endpoint
router.post('/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const authResponse = pusher.authorizeChannel(socketId, channel);
  res.send(authResponse);
});

// Send message via Pusher
router.post('/pusher/message', async (req, res) => {
  try {
    const { channel, event, data } = req.body;
    
    await pusher.trigger(channel, event, data);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending Pusher message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
