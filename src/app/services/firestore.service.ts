import { inject, Injectable } from '@angular/core';
import {
	addDoc,
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Conversation } from '../interfaces/chat.model';
import { Message } from '../interfaces/message.model';

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

  addMessageToConversation(conversationId: string, messageData: any) {
    const messagesRef = collection(this.firestore, 'conversations', conversationId, 'messages');

    // Add the server timestamp to the message data
    const dataWithTimestamp: Message = {
      ...messageData,
      timestamp: serverTimestamp(),
    };

    return addDoc(messagesRef, dataWithTimestamp);
  }
}
