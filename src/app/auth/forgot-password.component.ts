import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  message = '';
  error = '';
  isLoading = false;

  constructor(private authService: AuthService) {}

  async onSubmit() {
    this.message = '';
    this.error = '';
    if (!this.email) {
      this.error = 'Por favor ingresa tu correo electrónico.';
      return;
    }
    this.isLoading = true;
    try {
      await this.authService.sendPasswordResetEmail(this.email);
      this.message = 'Si el correo existe, se ha enviado un email con instrucciones para restablecer la contraseña.';
    } catch (err: any) {
      this.error = err?.message || 'Error al enviar el correo. Intenta nuevamente.';
    }
    this.isLoading = false;
  }
}
