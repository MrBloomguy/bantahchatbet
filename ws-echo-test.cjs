// Minimal WebSocket group chat server for testing
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4000 });
wss.on('connection', ws => {
  ws.on('message', msg => {
    // Broadcast the message to all clients (including sender)
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });
});
console.log('Group chat WebSocket server running on ws://localhost:4000');
