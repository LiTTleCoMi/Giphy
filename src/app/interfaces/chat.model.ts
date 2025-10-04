export interface Conversation {
  id: string; // The document ID from Firestore
  title: string;
  owner: string; // User UID of the owner
  participants: string[]; // An array of User UIDs
}
