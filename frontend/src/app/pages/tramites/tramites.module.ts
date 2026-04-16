import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TramitesComponent } from './tramites.component';

@NgModule({
  declarations: [TramitesComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: TramitesComponent }
    ])
  ]
})
export class TramitesModule {}
