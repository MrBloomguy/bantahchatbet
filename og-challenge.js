// Express server for Open Graph meta tags for challenge and event sharing
import express from 'express';
import fetch from 'node-fetch';
const app = express();
const PORT = process.env.PORT || 5005;

// Replace with your actual API endpoint or DB logic
async function getChallenge(id) {
  const res = await fetch(`http://localhost:5000/api/challenge/${id}`); // Update as needed
  if (!res.ok) return null;
  return await res.json();
}

// Replace with your actual API endpoint or DB logic
async function getEvent(id) {
  const res = await fetch(`http://localhost:5000/api/event/${id}`); // Update as needed
  if (!res.ok) return null;
  return await res.json();
}

app.get('/og/challenge/:id', async (req, res) => {
  const { id } = req.params;
  const challenge = await getChallenge(id);
  if (!challenge) {
    return res.status(404).send('Challenge not found');
  }
  const scheduled = challenge.scheduled_at ? new Date(challenge.scheduled_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA';
  const siteName = 'BantahChatBet';
  const locale = 'en_US';
  const ogUrl = `${req.protocol}://${req.get('host')}/challenge/${challenge.id}`;
  const ogImage = challenge.challenger.avatar_url && challenge.challenger.avatar_url.startsWith('http')
    ? challenge.challenger.avatar_url
    : req.protocol + '://' + req.get('host') + '/default-avatar.png';
  const ogImageAlt = `${challenge.challenger.name}'s avatar`;
  const ogTitle = `Challenge: ${challenge.challenger.name} vs ${challenge.challenged.name}`;
  const ogDescription = `${challenge.challenger.name} challenged ${challenge.challenged.name} to a ${challenge.game_type} match for ₦${challenge.amount}. Scheduled for ${scheduled}.`;
  res.set('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${ogTitle}</title>
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="${locale}" />
      <meta property="og:site_name" content="${siteName}" />
      <meta property="og:url" content="${ogUrl}" />
      <meta property="og:title" content="${ogTitle}" />
      <meta property="og:description" content="${ogDescription}" />
      <meta property="og:image" content="${ogImage}" />
      <meta property="og:image:alt" content="${ogImageAlt}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${ogTitle}" />
      <meta name="twitter:description" content="${ogDescription}" />
      <meta name="twitter:image" content="${ogImage}" />
      <meta name="twitter:image:alt" content="${ogImageAlt}" />
    </head>
    <body>
      <h1>${ogTitle}</h1>
      <p>${ogDescription}</p>
      <p>Scheduled for: ${scheduled}</p>
    </body>
    </html>
  `);
});

app.get('/og/event/:id', async (req, res) => {
  const { id } = req.params;
  const event = await getEvent(id);
  if (!event) {
    return res.status(404).send('Event not found');
  }
  const scheduled = event.scheduled_at ? new Date(event.scheduled_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA';
  const siteName = 'BantahChatBet';
  const locale = 'en_US';
  const ogUrl = `${req.protocol}://${req.get('host')}/event/${event.id}`;
  const ogImage = event.banner_url && event.banner_url.startsWith('http')
    ? event.banner_url
    : req.protocol + '://' + req.get('host') + '/default-event.png';
  const ogImageAlt = `${event.title || 'Event'} banner`;
  const ogTitle = `Event: ${event.title || 'Untitled Event'}`;
  const ogDescription = `${event.description || 'Join this event!'} Scheduled for ${scheduled}.`;
  res.set('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${ogTitle}</title>
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="${locale}" />
      <meta property="og:site_name" content="${siteName}" />
      <meta property="og:url" content="${ogUrl}" />
      <meta property="og:title" content="${ogTitle}" />
      <meta property="og:description" content="${ogDescription}" />
      <meta property="og:image" content="${ogImage}" />
      <meta property="og:image:alt" content="${ogImageAlt}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${ogTitle}" />
      <meta name="twitter:description" content="${ogDescription}" />
      <meta name="twitter:image" content="${ogImage}" />
      <meta name="twitter:image:alt" content="${ogImageAlt}" />
    </head>
    <body>
      <h1>${ogTitle}</h1>
      <p>${event.description || 'Join this event!'}</p>
      <p>Scheduled for: ${scheduled}</p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`OG meta tag server running on port ${PORT}`);
});
