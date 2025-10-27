import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    email = '';
    password = '';
    error = '';
    isLoading = false;
    showPassword = false;
    currentYear = new Date().getFullYear();

    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    async onLogin() {
        if (!this.email || !this.password) {
            this.error = 'Por favor ingrese email y contraseña.';
            return;
        }

        this.isLoading = true;
        this.error = '';

        try {
            const result = await this.authService.login(this.email, this.password);
            this.isLoading = false;

            if (result === true) {
                await this.router.navigateByUrl('/dashboard');
            } else if (typeof result === 'string') {
                const lowered = result.toLowerCase();
                if (lowered.includes('invalid login credentials')) {
                    this.error = 'Usuario o contraseña incorrectos.';
                } else if (lowered.includes('user not found')) {
                    this.error = 'El usuario no existe.';
                } else if (lowered.includes('email not confirmed')) {
                    this.error = 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
                } else {
                    this.error = result;
                }
            } else {
                this.error = 'Credenciales incorrectas o usuario no registrado.';
            }
        } catch (err: any) {
            this.isLoading = false;
            this.error = err?.message || 'Error de conexión. Intente nuevamente.';
            console.error(err);
        }
    }
}
