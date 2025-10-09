import { Injectable, inject } from '@angular/core';
import { Auth, User, authState, GoogleAuthProvider, signInWithPopup, signOut } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { UserProfile } from '../interfaces/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  readonly user$ = authState(this.auth);
  readonly isLoggedIn$ = this.user$.pipe(map((user) => !!user));

  async googleLogin() {
		const userCredential = await signInWithPopup(this.auth, new GoogleAuthProvider());
		await this.updateUserData(userCredential.user);
		return userCredential;
  }

  logout() {
    return signOut(this.auth);
  }

  private updateUserData(user: User) {
    // Get a reference to the user's document in the 'users' collection
    const userDocRef = doc(this.firestore, 'users', user.uid);

    // Create the data object we want to save
    const data: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
    };

    // Use setDoc to create or update the document
    return setDoc(userDocRef, data, { merge: true });
  }
}
