import { Injectable } from '@angular/core';
import {
    CanActivateFn,
    Router,
    UrlTree
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
    constructor(private auth: AuthService, private router: Router) { }

    canActivate(): boolean | UrlTree {
        if (this.auth.isAuthenticated()) return true;
        return this.router.parseUrl('/login');
    }
}

// For standalone route usage
export const canActivateAuth: CanActivateFn = () => {
    const service = new AuthService((null as unknown) as Router);
    return service.isAuthenticated();
};
