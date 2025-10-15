import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Conversation } from '../interfaces/chat.model';
import { Message } from '../interfaces/message.model';
import { UserProfile } from '../interfaces/user.model';
import { ConversationModel } from '../interfaces/conversation.model';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private firestore = inject(Firestore);

  getConversationsForUser(userId: string): Observable<Conversation[]> {
    const conversationsRef = collection(this.firestore, 'conversations');
    const q = query(conversationsRef, where('participants', 'array-contains', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Conversation[]>;
  }
  getConversationById(id: string): Observable<Conversation> {
    const conversationRef = doc(this.firestore, 'conversations/' + id);
    return docData(conversationRef, { idField: 'id' }) as Observable<Conversation>;
  }
  getMessagesByConversationId(id: string): Observable<Message[]> {
    const messagesRef = collection(this.firestore, 'conversations', id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }
  getUserProfiles(userIds: Array<string>) {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('uid', 'in', userIds));
    return collectionData(q, { idField: 'id' });
  }
  getAllUsers(): Observable<UserProfile[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef);
    return collectionData(q, { idField: 'uid' }) as Observable<UserProfile[]>;
  }

  addMessageToConversation(conversationId: string, messageData: any) {
    const messagesRef = collection(this.firestore, 'conversations', conversationId, 'messages');

    // Add the server timestamp to the message data
    const dataWithTimestamp: Message = {
      ...messageData,
      timestamp: serverTimestamp(),
    };

    return addDoc(messagesRef, dataWithTimestamp);
  }

  deleteMessage(message: Message) {
    console.log('Deleting message...');
    const messageRef = doc(
      this.firestore,
      'conversations',
      message.conversationId,
      'messages',
      message.id
    );
    return deleteDoc(messageRef);
  }

  createConversation(conversation: ConversationModel) {
    const conversationsRef = collection(this.firestore, 'conversations');
    return addDoc(conversationsRef, conversation);
  }
  async deleteConversation(conversationId: string): Promise<void> {
    const conversationRef = doc(this.firestore, 'conversations', conversationId);
    const messagesRef = collection(this.firestore, 'conversations', conversationId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    const batch = writeBatch(this.firestore);
    messagesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.delete(conversationRef);
    return batch.commit();
  }

  removeParticipantFromConversation(conversationId: string, userIdToRemove: string) {
    const conversationRef = doc(this.firestore, 'conversations', conversationId);
    return updateDoc(conversationRef, {
      participants: arrayRemove(userIdToRemove),
    });
  }
  addParticipantToConversation(conversationId: string, userIdToAdd: string) {
    const conversationRef = doc(this.firestore, 'conversations', conversationId);
    return updateDoc(conversationRef, {
      participants: arrayUnion(userIdToAdd),
    });
  }

  leaveConversation(conversationId: string, userId: string) {
    const conversationRef = doc(this.firestore, 'conversations', conversationId);
    return updateDoc(conversationRef, { participants: arrayRemove(userId) });
  }
}
