const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

const rooms = {};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      if (data.type === 'join') {
        ws.room = data.room;
        rooms[ws.room] = rooms[ws.room] || [];
        rooms[ws.room].push(ws);
      } else if (data.type === 'message') {
        // Broadcast to all in the room
        (rooms[data.room] || []).forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'message', ...data }));
          }
        });
        // TODO: Save to DB here for persistence
      }
    } catch (e) {
      // handle error
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter(client => client !== ws);
    }
  });
});

console.log('WebSocket server running on ws://localhost:3001');
