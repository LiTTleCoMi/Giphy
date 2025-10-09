import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Chats } from './pages/chats/chats';
import { authGuard } from './guards/auth-guard';
import { Chat } from './pages/chat/chat';
import { NewChat } from './pages/new-chat/new-chat';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'chats', component: Chats, canActivate: [authGuard] },
  { path: 'chats/:id', component: Chat, canActivate: [authGuard] },
  { path: 'new-chat', component: NewChat, canActivate: [authGuard] },
];
