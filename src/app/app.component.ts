import { Component, computed, signal, effect, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, User } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { supabase } from './supabase.client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NgIf, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  currentUser = signal<User | null>(null);
  isLogged = computed(() => !!this.currentUser());

  constructor(
    private auth: AuthService,
    public router: Router
  ) {
    this.currentUser.set(this.auth.getCurrentUser());

    effect(() => {
      this.currentUser.set(this.auth.getCurrentUser());
    });
  }

  async ngOnInit() {
    // Buscar la URL del icono desde la tabla imagenes por nombre
    const { data, error } = await supabase
      .from('imagenes')
      .select('url')
      .eq('nombre', 'icono-LaRoca')
      .single();
    if (data && data.url) {
      this.setFavicon(data.url);
    }
  }

  setFavicon(url: string) {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/x-icon';
    link.href = url;
  }

  openLogin() {
    location.href = '/login';
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
