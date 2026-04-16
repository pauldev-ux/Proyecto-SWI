import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PoliticasComponent } from './politicas.component';

@NgModule({
  declarations: [PoliticasComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: PoliticasComponent }
    ])
  ]
})
export class PoliticasModule {}
