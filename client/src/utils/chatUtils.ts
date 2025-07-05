// src/utils/chatUtils.js (or .ts)

import { db } from '../lib/firebase'; // Import the Firestore instance
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const createChat = async (chatName) => {
  try {
    const chatsCollection = collection(db, 'chats'); // Reference to 'chats' collection
    const docRef = await addDoc(chatsCollection, {
      chat_name: chatName, // Chat name
      created_at: serverTimestamp() // Timestamp of when the chat was created
    });
    console.log('Chat created with ID: ', docRef.id);
  } catch (e) {
    console.error('Error adding document: ', e);
  }
};
