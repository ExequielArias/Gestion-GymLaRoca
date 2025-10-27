import { ResetPasswordComponent } from './auth/reset-password.component';
import { ForgotPasswordComponent } from './auth/forgot-password.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AsistenciasComponent } from './asistencias/asistencias.component';
import { RutinasComponent } from './rutinas/rutinas.component';
import { ClientesComponent } from './clientes/clientes.component';
import { PagosComponent } from './pagos/pagos.component';
import { TiendaComponent } from './tienda/tienda.component';
import { AuthGuard, canActivateAuth } from './auth/auth.guard';
import { LayoutComponent } from './layout.component';



export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
      { path: 'asistencias', component: AsistenciasComponent, canActivate: [AuthGuard] },
      { path: 'rutinas', component: RutinasComponent, canActivate: [AuthGuard] },
      { path: 'clientes', component: ClientesComponent, canActivate: [AuthGuard] },
      { path: 'pagos', component: PagosComponent, canActivate: [AuthGuard] },
      { path: 'tienda', component: TiendaComponent, canActivate: [AuthGuard] },
    ]
  },
  { path: '**', redirectTo: '' }
];

// @NgModule({
//   imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
//   exports: [RouterModule]
// })
// export class AppRoutingModule { }
