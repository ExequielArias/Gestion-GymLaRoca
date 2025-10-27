import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../supabase.client';

export interface User {
  name: string;
  email: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Actualiza la contraseña del usuario autenticado (flujo de recuperación)
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message || 'No se pudo actualizar la contraseña.');
    }
    return true;
  }
  /**
   * Envía un email de recuperación de contraseña usando Supabase
   */
  async sendPasswordResetEmail(email: string) {
    // Cambia la URL por la de tu entorno de producción si es necesario
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      throw new Error(error.message || 'No se pudo enviar el email de recuperación.');
    }
    return true;
  }
  private _user = signal<User | null>(null);

  user$ = {
    get: () => this._user(),
  };

  constructor(private router: Router) {
    // intentar cargar usuario desde localStorage
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        this._user.set(user);
        // Si falta nombre o rol, buscar en la base de datos
        if (!user.name || !user.role) {
          this.refrescarDatosUsuario(user.email);
        }
      } catch { }
    }
  }

  private async refrescarDatosUsuario(email: string) {
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('nombre, correo, rol:rol_id(nombre)')
      .eq('correo', email)
      .single();
    if (!userError && userData) {
      const user: User = {
        name: userData.nombre,
        email: userData.correo,
        role: Array.isArray(userData.rol) && userData.rol.length > 0 ? userData.rol[0].nombre : ''
      };
      this._user.set(user);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Supabase Auth error:', error.message);
      return error.message || false;
    }

    // Buscar datos reales en la tabla usuarios y rol
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('nombre, correo, rol:rol_id(nombre)')
      .eq('correo', email)
      .single();

    if (userError || !userData) {
      // Si falla la consulta, usar datos mínimos
      const fallbackUser: User = {
        name: data.user?.email || '',
        email: data.user?.email || '',
        role: ''
      };
      this._user.set(fallbackUser);
      localStorage.setItem('auth_user', JSON.stringify(fallbackUser));
      return true;
    }

    const user: User = {
      name: userData.nombre,
      email: userData.correo,
      role: Array.isArray(userData.rol) && userData.rol.length > 0 ? userData.rol[0].nombre : ''
    };
    this._user.set(user);
    localStorage.setItem('auth_user', JSON.stringify(user));
    return true;
  }

  async logout() {
    await supabase.auth.signOut();
    this._user.set(null);
    localStorage.removeItem('auth_user');
    this.router.navigateByUrl('/login');
    setTimeout(() => window.location.reload(), 100);
  }

  getCurrentUser(): User | null {
    return this._user();
  }

  isAuthenticated(): boolean {
    return !!this._user();
  }
}
