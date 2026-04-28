import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule) },
  { 
    path: 'dashboard', 
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'monitor', 
    loadChildren: () => import('./pages/monitor/monitor.module').then(m => m.MonitorModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'funcionario'] }
  },
  { 
    path: 'analytics', 
    loadChildren: () => import('./pages/analytics/analytics.module').then(m => m.AnalyticsModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'funcionario'] }
  },
  { 
    path: 'tramites', 
    loadChildren: () => import('./pages/tramites/tramites.module').then(m => m.TramitesModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'departamentos', 
    loadChildren: () => import('./pages/departamentos/departamentos.module').then(m => m.DepartamentosModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'usuarios', 
    loadChildren: () => import('./pages/usuarios/usuarios.module').then(m => m.UsuariosModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'chatbot', 
    loadChildren: () => import('./pages/chatbot/chatbot.module').then(m => m.ChatbotModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
