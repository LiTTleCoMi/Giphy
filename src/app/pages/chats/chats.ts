import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, switchMap, tap } from 'rxjs';
import { FirestoreService } from '../../services/firestore.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-chats',
  imports: [AsyncPipe],
  templateUrl: './chats.html',
  styleUrl: './chats.scss',
})
export class Chats {
  private auth = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  conversations$ = this.auth.user$.pipe(
    tap((user) => console.log('Auth State Change:', user)),
    switchMap((user) => {
      if (user) {
        return this.firestoreService.getConversationsForUser(user.uid);
      } else {
        return of([]);
      }
    })
  );

  async logout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error(`Logout failed: ${error}`);
    }
  }
}
