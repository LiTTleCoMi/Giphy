export interface Message {
  id: string;
  conversationId: string;
  giphyId: string; // The ID from the Giphy API
  senderId: string; // User UID
  timestamp: any; // Firestore Timestamp
}
