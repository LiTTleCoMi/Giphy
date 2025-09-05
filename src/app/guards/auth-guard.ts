import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
	const auth = inject(AuthService);
	const router = inject(Router);

	return auth.isLoggedIn$.pipe(
		take(1),
		map(isLoggedIn => {
			if (isLoggedIn) {
				return true;
			} else {
				router.navigate(['/login']);
				return false;
			}
		})
	)
};
