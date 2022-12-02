import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material';
import { FuseSharedModule } from '@fuse/shared.module';

import { NotFoundComponent } from './not-found.component';

const routes = [
  {
      path     : '404',
      component: NotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    MatIconModule,
    FuseSharedModule
  ],
  declarations: [NotFoundComponent]
})
export class NotFoundModule { }
