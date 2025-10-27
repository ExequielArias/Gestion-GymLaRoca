import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  providers: [AuthService],
  template: `
    <header class="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 shadow-md h-20">
      <div class="container mx-auto px-6 py-5 flex items-center h-full">
        <nav class="flex flex-row gap-8 items-center">
            <a [routerLink]="['/']" routerLinkActive="tab-active" [routerLinkActiveOptions]="{ exact: true }" class="tab-link">Inicio</a>
            <a [routerLink]="['/asistencias']" routerLinkActive="tab-active" class="tab-link">Control de asistencia</a>
            <a [routerLink]="['/clientes']" routerLinkActive="tab-active" class="tab-link">Gestión de clientes</a>
            <a [routerLink]="['/rutinas']" routerLinkActive="tab-active" class="tab-link">Rutinas de entrenamiento</a>
            <a [routerLink]="['/pagos']" routerLinkActive="tab-active" class="tab-link">Gestión de pago</a>
            <a [routerLink]="['/tienda']" routerLinkActive="tab-active" class="tab-link">Tienda</a>
          </nav>
        <div class="flex-1"></div> <!-- This div is kept for spacing -->
        <button (click)="logout()" class="ml-8 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center justify-center" title="Cerrar sesión">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h7v2zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"/></svg>
        </button>
      </div>
    </header>
    <main class="flex-1">
      <router-outlet></router-outlet>
    </main>
    <footer class="bg-gray-900 text-white py-12 px-6">
      <div class="container mx-auto max-w-6xl text-center">
        <h3 class="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Gym LaRoca
        </h3>
        <p class="text-gray-400 text-lg mb-6">Transforma tu vida hoy. Únete a nuestra comunidad.</p>
        <div class="border-t border-gray-800 pt-6 text-gray-500 text-sm">
          <p>© 2025 Gym LaRoca. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
    <style>
      .tab-link {
        padding: 0.5rem 1.5rem;
        border-radius: 0.375rem;
        font-size: 1rem;
        font-weight: 500;
        color: #d1d5db;
        transition: color 0.2s, background 0.2s;
        text-decoration: none;
        display: inline-block;
        white-space: nowrap;
      }
      .tab-link:hover {
        color: #f87171;
        background: #1f2937;
      }
      .tab-active {
        color: #f87171;
        background: #1f2937;
        font-weight: 600;
      }
    </style>
  `
})
export class LayoutComponent {
  constructor(private router: Router, private auth: AuthService) {}
  logout() {
    this.auth.logout();
  }
}
