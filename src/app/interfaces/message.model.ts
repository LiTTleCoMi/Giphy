export interface Message {
  id: string;
  conversationId: string; // Reference to the conversationId for more query flexibility if needed
  body: string; // The text body of the message
  giphyId: string; // The ID from the Giphy API
  senderId: string; // User UID
  timestamp: any; // Firestore Timestamp
}
