import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FuseSharedModule } from '@fuse/shared.module';
import { 
  MatButtonModule, 
  MatCheckboxModule, 
  MatFormFieldModule, 
  MatInputModule } from '@angular/material';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../auth.service';
import { AuthGuardService } from '../auth-guard.service';

const routes = [
  {
      path     : 'forgot-password',
      component: ForgotPasswordComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    FuseSharedModule
  ],
  declarations: [
    ForgotPasswordComponent
  ],
  providers: [
    AuthService,
    AuthGuardService
  ]
})
export class ForgotPasswordModule { }
