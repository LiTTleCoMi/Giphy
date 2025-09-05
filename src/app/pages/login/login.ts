import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { map, Subscription, take, tap } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnDestroy {
  private auth = inject(AuthService);
	private router = inject(Router);
	private loggedInSubscription = new Subscription();

  constructor() {
    // check if logged in
    this.loggedInSubscription = this.auth.isLoggedIn$.pipe(
      take(1),
      tap((isLoggedIn) => {
        if (isLoggedIn) {
          this.router.navigate(['/chats']);
        }
      })
    ).subscribe();
  }

  async login() {
    try {
      await this.auth.googleLogin();
      this.router.navigate(['/chats']);
    } catch (error) {
      console.error(`Login failed: ${error}`);
    }
  }
	
	ngOnDestroy(): void {
		this.loggedInSubscription.unsubscribe();
	}
}
