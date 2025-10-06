import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs';
import { FirestoreService } from '../../services/firestore.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-conversation',
  imports: [AsyncPipe],
  templateUrl: './conversation.html',
  styleUrl: './conversation.scss',
})
export class Conversation {
  private firestoreService = inject(FirestoreService);
  private route = inject(ActivatedRoute);
	conversation$ = this.route.paramMap.pipe(
		map((params) => params.get('id')),
		filter((id): id is string => id !== null && id !== undefined),
		switchMap((id) => this.firestoreService.getConversationById(id))
	);
}
