import {
  AfterViewChecked,
  Component,
  ElementRef,
  HostListener,
  inject,
  ViewChild,
} from '@angular/core';
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
export class Chat implements AfterViewChecked {
  private firestoreService = inject(FirestoreService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private giphyService = inject(GiphyService);
  private hasScrolledInitially = false;
  private userScrolledAway = false;

  @ViewChild('chat') private chatContainer?: ElementRef<HTMLDivElement>;

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

  ngAfterViewChecked() {
    if (this.hasScrolledInitially) return;

    const el = this.chatContainer?.nativeElement;
    if (el && el.scrollHeight > 0) {
      // messages are rendered; jump to bottom once
      this.scrollToBottom();
      this.hasScrolledInitially = true;
    }
  }

  private scheduleScrollIfReady(smooth = true) {
    const attempt = () => {
      const el = this.chatContainer?.nativeElement;
      if (!el) {
        requestAnimationFrame(attempt);
        return;
      }

      // second rAF ensures new children are painted and scrollHeight updated
      requestAnimationFrame(() => {
        // don't yank the user's position if they scrolled away
        if (this.userScrolledAway) return;

        // if there's content, scroll
        if (el.scrollHeight > 0) {
          if (smooth) this.scrollToBottomSmooth();
          else this.scrollToBottom();
        }
      });
    };

    requestAnimationFrame(attempt);
  }

  private scrollToBottom() {
    const el = this.chatContainer?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  private scrollToBottomSmooth() {
    const el = this.chatContainer?.nativeElement;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });
  }

  private isAtBottom(): boolean {
    const el = this.chatContainer?.nativeElement;
    if (!el) return false;
    const threshold = 100; // pixels from bottom
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  onChatScroll() {
    const el = this.chatContainer?.nativeElement;
    if (!el) return;
    // set flag true when user is NOT within 100px of bottom
    this.userScrolledAway = !(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
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
    switchMap((id) => this.firestoreService.getMessagesByConversationId(id)),
    tap(() => {
      this.scheduleScrollIfReady(true);
    })
  );
  chatData$ = combineLatest([this.messages$, this.userProfiles$]).pipe(
    map(([messages, profiles]) => {
      // Create a lookup map for fast access to profiles
      const profilesMap = new Map(profiles.map((p) => [p['uid'], p]));

      // Add senderName and modify timestamp
      return messages.map((message) => ({
        ...message,
        senderName: profilesMap.get(message.senderId)?.['displayName'] || 'Unknown',
        timestamp: message.timestamp?.toDate(),
      }));
    })
  );
  currentUserId$ = this.authService.user$.pipe(
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
    const user = await firstValueFrom(this.authService.user$);
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
				this.userScrolledAway = false;
				this.scheduleScrollIfReady(false);
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
