import { Component, OnInit } from '@angular/core';
import { PoliticaService } from '../../services/politica.service';
import { PoliticaNegocio } from '../../models';

@Component({
  selector: 'app-politicas',
  templateUrl: './politicas.component.html',
  styleUrls: ['./politicas.component.css']
})
export class PoliticasComponent implements OnInit {
  politicas: PoliticaNegocio[] = [];
  cargando = false;

  constructor(private politicaService: PoliticaService) {}

  ngOnInit(): void {
    this.cargarPoliticas();
  }

  cargarPoliticas(): void {
    this.cargando = true;
    this.politicaService.listarPoliticas().subscribe({
      next: (politicas) => {
        this.politicas = politicas;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar políticas', err);
        this.cargando = false;
      }
    });
  }
}
