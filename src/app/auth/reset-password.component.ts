import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  password = '';
  confirmPassword = '';
  error = '';
  message = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  async onSubmit() {
    this.error = '';
    this.message = '';
    if (!this.password || !this.confirmPassword) {
      this.error = 'Completa ambos campos.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }
    this.isLoading = true;
    try {
      await this.authService.updatePassword(this.password);
      this.message = '¡Contraseña actualizada correctamente! Ahora puedes iniciar sesión.';
      setTimeout(() => this.router.navigateByUrl('/login'), 2000);
    } catch (err: any) {
      this.error = err?.message || 'No se pudo actualizar la contraseña.';
    }
    this.isLoading = false;
  }
}
