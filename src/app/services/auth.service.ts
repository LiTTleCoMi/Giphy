import { Injectable, inject } from '@angular/core';
import { Auth, authState, GoogleAuthProvider, signInWithPopup, signOut } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { UserProfile } from '../interfaces/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);

  // An observable stream of the current user's authentication state
  readonly user$ = authState(this.auth);

  // An observable stream that maps the user state to true (logged in) or false (logged out)
  readonly isLoggedIn$ = this.user$.pipe(map((user) => !!user));

  // Triggers the Google login pop-up
  googleLogin() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  // Logs the current user out
  logout() {
    return signOut(this.auth);
  }
}
