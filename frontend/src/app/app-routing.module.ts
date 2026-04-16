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
    canActivate: [AuthGuard]
  },
  { 
    path: 'politicas', 
    loadChildren: () => import('./pages/politicas/politicas.module').then(m => m.PoliticasModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'tramites', 
    loadChildren: () => import('./pages/tramites/tramites.module').then(m => m.TramitesModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'departamentos', 
    loadChildren: () => import('./pages/departamentos/departamentos.module').then(m => m.DepartamentosModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'usuarios', 
    loadChildren: () => import('./pages/usuarios/usuarios.module').then(m => m.UsuariosModule),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
