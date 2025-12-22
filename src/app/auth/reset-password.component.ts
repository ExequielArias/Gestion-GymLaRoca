import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { OnInit } from '@angular/core';
import { supabase } from '../supabase.client';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  error = '';
  message = '';
  isLoading = false;
  hasSession = false;

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    // Intentar obtener la sesión/tokens desde la URL que envía Supabase tras clicar el email
    // Esto es necesario para que `supabase.auth.updateUser` funcione en el flujo de recuperación
    try {
      // Algunos clientes/hosts no exponen el helper; parsear tokens manualmente desde hash (fragment) y query params
      let sessionSet = false;

      // Leer fragmento (#access_token=...)
      const hash = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hash);
      const accessTokenHash = hashParams.get('access_token');
      const refreshTokenHash = hashParams.get('refresh_token');

      // Leer query params (?access_token=...)
      const qp = new URL(window.location.href).searchParams;
      const accessTokenQuery = qp.get('access_token') || qp.get('token');
      const refreshTokenQuery = qp.get('refresh_token');

      const accessToken = accessTokenHash || accessTokenQuery;
      const refreshToken = (refreshTokenHash || refreshTokenQuery) ?? '';

      if (accessToken) {
        try {
          // `setSession` espera strings para ambos campos según tipos; pasar cadena vacía si falta refresh
          const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) {
            console.error('setSession returned error:', error.message || error);
          } else {
            console.debug('Session set from tokens:', data);
            sessionSet = true;

            // Limpiar URL para no dejar tokens visibles
            try {
              const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
              history.replaceState({}, document.title, cleanUrl);
            } catch (e) {
              /* no-op */
            }
          }
        } catch (setErr) {
          console.error('Failed to set session from tokens', setErr);
        }
      } else {
        console.debug('No access_token found in hash or query params');
      }

      // Comprobar sesión real
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session ?? null;
      this.hasSession = !!session || sessionSet;
      if (!this.hasSession) {
        this.message = 'No se detectó sesión de recuperación. Si abriste el enlace desde una app de correo, prueba en un navegador web o revisa los Redirect URLs en Supabase.';
      }
    } catch (err) {
      console.error('Error while getting session from URL', err);
    }
  }

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
    // Asegurar que existe una sesión de recuperación (token) antes de intentar cambiar la contraseña
    if (!this.hasSession) {
      this.error = 'No se detectó el token de recuperación. Abre el enlace del correo en un navegador o revisa la configuración de redirecciones.';
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
