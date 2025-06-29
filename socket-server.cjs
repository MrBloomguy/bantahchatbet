// Minimal Socket.IO group chat server for testing
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for testing
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    // Broadcast to all clients (including sender)
    io.emit('chat message', msg);
  });
});

server.listen(4000, () => {
  console.log('Socket.IO group chat server running on http://localhost:4000');
});
