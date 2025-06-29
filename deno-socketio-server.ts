// deno-socketio-server.ts
// Simple Deno Socket.IO server for event chat
// Run with: deno run --allow-net deno-socketio-server.ts

import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";

const io = new Server();

// In-memory message store (for demo only)
const eventMessages: Record<string, any[]> = {};

io.on("connection", (socket) => {
  console.log("[Socket.IO] Client connected", socket.id);

  socket.on("join event", ({ eventId }) => {
    if (!eventId) return;
    socket.join(eventId);
    // Send chat history
    socket.emit("event chat history", eventMessages[eventId] || []);
    console.log(`[Socket.IO] ${socket.id} joined event ${eventId}`);
  });

  socket.on("leave event", ({ eventId }) => {
    if (!eventId) return;
    socket.leave(eventId);
    console.log(`[Socket.IO] ${socket.id} left event ${eventId}`);
  });

  socket.on("event chat message", (msg) => {
    const { eventId, ...rest } = msg;
    if (!eventId) return;
    // Assign a simple unique id (timestamp + random)
    const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const message = { id, ...rest };
    if (!eventMessages[eventId]) eventMessages[eventId] = [];
    eventMessages[eventId].push(message);
    // Limit history to last 100 messages
    if (eventMessages[eventId].length > 100) {
      eventMessages[eventId] = eventMessages[eventId].slice(-100);
    }
    // Broadcast to all in the event room
    io.to(eventId).emit("event chat message", message);
    console.log(`[Socket.IO] Message for event ${eventId}:`, message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
  });
});

const PORT = parseInt(Deno.env.get("PORT") || "4000");
io.listen(PORT);
console.log(`[Socket.IO] Deno server running on http://localhost:${PORT}/`);
