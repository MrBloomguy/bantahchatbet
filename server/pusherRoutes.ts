import { Router } from 'express';
import { pusher } from './pusher';

const router = Router();

// Pusher authentication endpoint
router.post('/pusher/auth', async (req, res) => {
  try {
    const { socket_id, channel_name } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth verification failed:', error);
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    // Fetch user profile from database to get actual user data
    const { data: userProfile } = await supabase
      .from('users')
      .select('name, username, avatar_url')
      .eq('id', user.id)
      .single();

    // Generate auth string for Pusher
    const auth = pusher.authenticate(socket_id, channel_name, {
      user_id: user.id,
      user_info: {
        name: userProfile?.name || userProfile?.username || user.email?.split('@')[0] || 'User',
        username: userProfile?.username || 'user',
        avatar_url: userProfile?.avatar_url || '/default-avatar.png'
      }
    });

    res.json(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
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