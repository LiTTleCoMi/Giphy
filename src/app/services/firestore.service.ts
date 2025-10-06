import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  query,
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
}
