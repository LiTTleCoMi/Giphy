import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { FirestoreService } from '../../services/firestore.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-chats',
  imports: [AsyncPipe, RouterModule],
  templateUrl: './chats.html',
  styleUrl: './chats.scss',
})
export class Chats {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  conversations$ = this.authService.user$.pipe(
    switchMap((user) => {
      if (user) {
        // console.log(user);
        return this.firestoreService.getConversationsForUser(user.uid);
      } else {
        return of([]);
      }
    })
  );
  currentUserId$ = this.authService.user$.pipe(
    map((user) => {
      return user?.uid;
    })
  );
  vm$ = combineLatest({ conversations: this.conversations$, currentUserId: this.currentUserId$ });

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error(`Logout failed: ${error}`);
    }
  }

  async deleteConversation(conversationId: string) {
    try {
      await this.firestoreService.deleteConversation(conversationId);
    } catch (error) {
      console.error('Conversation deletion failed:', error);
    }
	}
	
	async leaveConversation(conversationId: string, userId: string) {
		try {
      await this.firestoreService.leaveConversation(conversationId, userId);
    } catch (error) {
      console.error('Leaving conversation failed:', error);
    }
	}
}
