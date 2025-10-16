import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { combineLatest, map, firstValueFrom } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators, FormGroup, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-new-chat',
  imports: [AsyncPipe, ReactiveFormsModule, RouterModule],
  templateUrl: './new-chat.html',
  styleUrl: './new-chat.scss',
})
export class NewChat {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  users$ = combineLatest([this.authService.user$, this.firestoreService.getAllUsers()]).pipe(
    map(([currentUser, users]) => {
      return users.filter((user) => user?.uid !== currentUser?.uid);
    })
  );

  newUserForm = new FormGroup({
    title: new FormControl('', [Validators.required]),

    participants: new FormArray<FormControl<string>>(
      [],
      [Validators.required, Validators.minLength(1)]
    ),
  });

  get participantsFormArray() {
    return this.newUserForm.get('participants') as FormArray;
  }

  onUserSelectionChange(event: any): void {
    const uid = event.target.value;
    if (event.target.checked) {
      this.participantsFormArray.push(new FormControl(uid));
    } else {
      const index = this.participantsFormArray.controls.findIndex((x) => x.value === uid);
      this.participantsFormArray.removeAt(index);
    }
  }

  // Method to create the conversation
  async createConversation(): Promise<void> {
    if (!this.newUserForm.valid) return;

    const { title, participants: selectedUserIds } = this.newUserForm.value;

    const currentUser = await firstValueFrom(this.authService.user$);
    const currentUserId = currentUser?.uid;

    if (!selectedUserIds || !currentUserId || !title) return;

    const participants = [...selectedUserIds, currentUserId];

    try {
      const docRef = await this.firestoreService.createConversation({
        title,
        owner: currentUserId,
        participants,
      });
      
      this.router.navigate(['/chats', docRef.id]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }
}
