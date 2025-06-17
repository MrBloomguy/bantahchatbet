import jwt from 'jsonwebtoken';

interface BotpressMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  tags: Record<string, any>;
  payload: {
    type: string;
    text?: string;
    // Add other payload types as needed
  };
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  tags: Record<string, any>;
  created_at: string;
}

interface User {
  id: string;
  tags: Record<string, any>;
  created_at: string;
  key?: string;
}

const WEBHOOK_ID = 'a87908ca-e227-4ed7-ab84-6a618ab380cc';
const API_URL = `https://chat.botpress.cloud/${WEBHOOK_ID}`;
const ENCRYPTION_KEY = process.env.BOTPRESS_ENCRYPTION_KEY || '';

export class BotpressClient {
  private userKey: string;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    // Sign the user key using JWT if encryption key is available
    if (ENCRYPTION_KEY) {
      this.userKey = jwt.sign({ id: userId }, ENCRYPTION_KEY, { algorithm: 'HS256' });
    } else {
      this.userKey = ''; // Will be set after creating/getting user
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.userKey && { 'x-user-key': this.userKey }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Botpress API error: ${response.statusText}`);
    }

    return response.json();
  }

  async initialize(): Promise<User> {
    if (ENCRYPTION_KEY) {
      // Use getOrCreateUser when using manual authentication
      const user = await this.getOrCreateUser();
      return user;
    } else {
      // Use createUser when not using manual authentication
      const user = await this.createUser();
      this.userKey = user.key || '';
      return user;
    }
  }

  async createUser(tags: Record<string, any> = {}): Promise<User> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ tags }),
    });
  }

  async getOrCreateUser(tags: Record<string, any> = {}): Promise<User> {
    return this.request('/users/get-or-create', {
      method: 'POST',
      body: JSON.stringify({
        id: this.userId,
        tags,
      }),
    });
  }

  async createConversation(tags: Record<string, any> = {}): Promise<Conversation> {
    return this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify({ tags }),
    });
  }

  async sendMessage(conversationId: string, text: string): Promise<BotpressMessage> {
    return this.request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'text',
        text,
      }),
    });
  }

  async listMessages(conversationId: string, limit = 20, before?: string): Promise<{ messages: BotpressMessage[] }> {
    const query = before ? `?before=${before}&limit=${limit}` : `?limit=${limit}`;
    return this.request(`/conversations/${conversationId}/messages${query}`);
  }

  listenToConversation(conversationId: string, onMessage: (message: BotpressMessage) => void): () => void {
    const eventSource = new EventSource(
      `${API_URL}/conversations/${conversationId}/stream?userKey=${this.userKey}`
    );

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessage(message);
    };

    return () => eventSource.close();
  }
}
