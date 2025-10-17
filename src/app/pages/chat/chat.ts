import { Component, HostListener, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { combineLatest, filter, map, switchMap, tap, firstValueFrom } from 'rxjs';
import { FirestoreService } from '../../services/firestore.service';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GiphyService } from '../../services/giphy.service';
import { GiphyDisplay } from '../../components/giphy-display/giphy-display';
import { Message } from '../../interfaces/message.model';

@Component({
  selector: 'app-conversation',
  imports: [AsyncPipe, ReactiveFormsModule, GiphyDisplay, RouterModule, DatePipe],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private firestoreService = inject(FirestoreService);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private giphyService = inject(GiphyService);

  attachedGiphyUrl: string | null = null;
  attachedGiphyId: string | null = null;
  screenWidth = window.innerWidth;
  showParticipants = this.screenWidth > 800;

  toggleParticipants() {
    this.showParticipants = !this.showParticipants;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    this.screenWidth = (event.target as Window).innerWidth;
    if (this.screenWidth > 800) this.showParticipants = true;
  }

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
				timestamp: message.timestamp?.toDate(),
      }));
    })
  );
  currentUserId$ = this.auth.user$.pipe(
    map((user) => {
      return user?.uid;
    })
  );
  potentialParticipants$ = combineLatest([
    this.firestoreService.getAllUsers(),
    this.conversation$,
  ]).pipe(
    map(([allUsers, conversation]) => {
      if (!conversation) return [];
      return allUsers.filter((user) => !conversation.participants.includes(user.uid));
    })
  );
  vm$ = combineLatest({
    conversation: this.conversation$,
    chatData: this.chatData$,
    currentUserId: this.currentUserId$,
    profiles: this.userProfiles$,
    potentialParticipants: this.potentialParticipants$,
  });

  messageForm = new FormGroup({
    body: new FormControl('', [Validators.required]),
  });

  async onSendMessage(): Promise<void> {
    if (!this.messageForm.valid || !this.messageForm.value.body) {
      return;
    }

    const message = this.messageForm.value.body!;

    const conversationId = this.route.snapshot.paramMap.get('id');
    const user = await firstValueFrom(this.auth.user$);
    const userId = user?.uid;

    if (!conversationId || !userId) {
      console.error('Conversation or User ID is missing!');
      return;
    }

    const messageData = {
      body: message,
      senderId: userId,
      giphyId: this.attachedGiphyId,
      conversationId,
    };

    this.firestoreService
      .addMessageToConversation(conversationId, messageData)
      .then(() => {
        this.messageForm.reset();
        this.attachedGiphyUrl = null;
        this.attachedGiphyId = null;
      })
      .catch((error) => console.error('Error sending message:', error));
  }

  attachRandomGif() {
    this.giphyService.getRandomGif().subscribe({
      next: (response: any) => {
        console.log('Random GIF Data:', response);
        this.attachedGiphyUrl = response.data.images.fixed_height.url;
        this.attachedGiphyId = response.data.id;
      },
      error(err) {
        console.error(`Something went wrong fetching random gif.\nError: ${err}`);
      },
    });
  }

  deleteMessage(message: Message) {
    this.firestoreService.deleteMessage(message);
  }

  removeParticipant(userIdToRemove: string) {
    const conversationId = this.route.snapshot.paramMap.get('id');
    if (!conversationId) return;

    this.firestoreService
      .removeParticipantFromConversation(conversationId, userIdToRemove)
      .catch((error) => console.error('Failed to remove participant:', error));
  }
  addParticipant(userIdToAdd: string) {
    const conversationId = this.route.snapshot.paramMap.get('id');
    if (!conversationId || !userIdToAdd) return;

    this.firestoreService
      .addParticipantToConversation(conversationId, userIdToAdd)
      .catch((error) => console.error('Failed to add participant:', error));
  }
}
