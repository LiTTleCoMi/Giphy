import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, filter, map, switchMap, tap, firstValueFrom } from 'rxjs';
import { FirestoreService } from '../../services/firestore.service';
import { AsyncPipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-conversation',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private firestoreService = inject(FirestoreService);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  conversation$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => id !== null && id !== undefined),
    switchMap((id) => this.firestoreService.getConversationById(id))
  );
  userProfiles$ = this.conversation$.pipe(
    filter((conversation) => !!conversation),
    switchMap((conversation) => {
      return this.firestoreService.getUserProfiles(conversation.participants);
    })
  );
  messages$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => id !== null && id !== undefined),
    switchMap((id) => this.firestoreService.getMessagesByConversationId(id))
  );
  chatData$ = combineLatest([this.messages$, this.userProfiles$]).pipe(
    map(([messages, profiles]) => {
      // Create a lookup map for fast access to profiles
      const profilesMap = new Map(profiles.map((p) => [p['uid'], p]));

      // Add senderName to each message
      return messages.map((message) => ({
        ...message,
        senderName: profilesMap.get(message.senderId)?.['displayName'] || 'Unknown',
      }));
    })
  );

  messageForm = new FormGroup({
    body: new FormControl('', [Validators.required]),
  });

  async onSendMessage(): Promise<void> {
    if (!this.messageForm.valid || !this.messageForm.value.body) {
      return;
    }

    const message = this.messageForm.value.body!;
    console.log('User wants to send:', message);

    // Get the current conversation ID from the route snapshot
    const conversationId = this.route.snapshot.paramMap.get('id');
    // Get the current user's ID from the user$ observable
    const user = await firstValueFrom(this.auth.user$);
    const userId = user?.uid;

    if (!conversationId || !userId) {
      console.error('Conversation or User ID is missing!');
      return;
    }

    const messageData = {
      body: message,
      senderId: userId,
      giphyId: '',
      conversationId,
    };

    this.firestoreService
      .addMessageToConversation(conversationId, messageData)
      .then(() => {
        this.messageForm.reset();
      })
      .catch((error) => console.error('Error sending message:', error));
  }
}
