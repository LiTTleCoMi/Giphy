import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Chats } from './pages/chats/chats';
import { authGuard } from './guards/auth-guard';
import { Conversation } from './pages/conversation/conversation';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'chats', component: Chats, canActivate: [authGuard] },
  { path: 'chats/:id', component: Conversation, canActivate: [authGuard] },
];
