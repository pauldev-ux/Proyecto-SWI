import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { DepartamentosComponent } from './departamentos.component';

const routes: Routes = [
  { path: '', component: DepartamentosComponent }
];

@NgModule({
  declarations: [DepartamentosComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class DepartamentosModule { }
