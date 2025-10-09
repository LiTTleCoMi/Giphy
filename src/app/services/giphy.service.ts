import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GiphyService {
  private http = inject(HttpClient);
  private apiKey = environment.giphyApiKey;

  getRandomGif() {
    const url = `https://api.giphy.com/v1/gifs/random?api_key=${this.apiKey}&rating=g`;
    return this.http.get(url);
  }
  getGifById(id: string) {
    const url = `https://api.giphy.com/v1/gifs/${id}?api_key=${this.apiKey}&rating=g`;
    return this.http.get(url);
  }
}
