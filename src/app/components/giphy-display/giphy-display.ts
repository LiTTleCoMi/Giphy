import { Component, inject, Input, OnInit } from '@angular/core';
import { GiphyService } from '../../services/giphy.service';

@Component({
  selector: 'app-giphy-display',
  imports: [],
  templateUrl: './giphy-display.html',
  styleUrl: './giphy-display.scss',
})
export class GiphyDisplay implements OnInit {
  @Input({ required: true }) giphyId!: string;
  private giphyService = inject(GiphyService);

  giphyUrl: string | null = null;

	ngOnInit(): void {
		if (!this.giphyId) return;
    this.giphyService.getGifById(this.giphyId).subscribe({
      next: (response: any) => {
        this.giphyUrl = response.data.images.fixed_height.url;
      },
      error: (err) => {
        console.error("Error fetching gif:", err.message);
      },
    });
  }
}
