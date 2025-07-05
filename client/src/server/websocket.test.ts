import { WebSocket } from 'ws';
import { supabase } from '../lib/supabase';

const WS_URL = 'ws://localhost:8080';

describe('WebSocket Chat Server', () => {
  let client1: WebSocket;
  let client2: WebSocket;
  const testUser1Id = 'test-user-1';
  const testUser2Id = 'test-user-2';

  beforeEach((done) => {
    client1 = new WebSocket(WS_URL);
    client2 = new WebSocket(WS_URL);

    let connected = 0;
    const onConnect = () => {
      connected++;
      if (connected === 2) done();
    };

    client1.on('open', onConnect);
    client2.on('open', onConnect);
  });

  afterEach(() => {
    client1.close();
    client2.close();
  });

  it('should authenticate users', (done) => {
    client1.send(JSON.stringify({ type: 'auth', userId: testUser1Id }));
    client2.send(JSON.stringify({ type: 'auth', userId: testUser2Id }));

    setTimeout(done, 100); // Give time for authentication to process
  });

  it('should send and receive messages', (done) => {
    const testMessage = 'Hello, this is a test message!';

    // Authenticate users first
    client1.send(JSON.stringify({ type: 'auth', userId: testUser1Id }));
    client2.send(JSON.stringify({ type: 'auth', userId: testUser2Id }));

    // Set up message receiver
    client2.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'message') {
        expect(message.message.content).toBe(testMessage);
        expect(message.message.sender_id).toBe(testUser1Id);
        expect(message.message.receiver_id).toBe(testUser2Id);
        done();
      }
    });

    // Send message after a short delay to ensure authentication is complete
    setTimeout(() => {
      client1.send(JSON.stringify({
        type: 'chat',
        receiverId: testUser2Id,
        content: testMessage
      }));
    }, 100);
  });

  it('should store messages in database', async () => {
    const testMessage = 'Test database storage';

    // Authenticate user
    client1.send(JSON.stringify({ type: 'auth', userId: testUser1Id }));

    // Send message
    client1.send(JSON.stringify({
      type: 'chat',
      receiverId: testUser2Id,
      content: testMessage
    }));

    // Wait for message to be stored
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check database
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', testUser1Id)
      .eq('receiver_id', testUser2Id)
      .eq('content', testMessage)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data.content).toBe(testMessage);
  });

  it('should create notification when message is sent', async () => {
    const testMessage = 'Test notification creation';

    // Authenticate user
    client1.send(JSON.stringify({ type: 'auth', userId: testUser1Id }));

    // Send message
    client1.send(JSON.stringify({
      type: 'chat',
      receiverId: testUser2Id,
      content: testMessage
    }));

    // Wait for notification to be created
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check notifications table
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUser2Id)
      .eq('type', 'new_message')
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data.type).toBe('new_message');
  });
}));