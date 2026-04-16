import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MonitorComponent } from './monitor.component';

@NgModule({
  declarations: [MonitorComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: MonitorComponent }
    ])
  ]
})
export class MonitorModule {}
