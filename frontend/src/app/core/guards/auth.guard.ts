import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const token = this.usuarioService.obtenerToken();
    const usuario = this.usuarioService.obtenerUsuarioActualValue();
    const allowedRoles: string[] = (route.data?.['roles'] as string[]) || [];

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    if (allowedRoles.length > 0) {
      if (!usuario || !allowedRoles.includes(usuario.rol)) {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}
