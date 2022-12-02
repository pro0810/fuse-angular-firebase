import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FuseSharedModule } from '@fuse/shared.module';
import { 
  MatButtonModule, 
  MatCheckboxModule, 
  MatFormFieldModule, 
  MatInputModule, 
  MatSelectModule,
  MatDialogModule,
  MatIconModule,
  MatListModule,
  MatToolbarModule} from '@angular/material';
import { RegisterComponent } from './register.component';
import { AuthService } from '../auth.service';
import { AuthGuardService } from '../auth-guard.service';
import { OrganizationListService } from '../../organizations/organization-list.service';
import { PrivacyDialogComponent } from './privacy/privacy.component';
import { LocationDialogComponent } from './location/location.component';
import { AgmCoreModule } from '@agm/core';

const routes = [
  {
      path     : 'register',
      component: RegisterComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    FuseSharedModule,

    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCUkQGJqSh-AOPsw2mEG4xW2NBXM4yvrKs'
    }),

  ],
  declarations: [
    RegisterComponent,
    PrivacyDialogComponent,
    LocationDialogComponent
  ],
  providers: [
    AuthService,
    AuthGuardService,
    OrganizationListService
  ],
  entryComponents: [PrivacyDialogComponent, LocationDialogComponent]
})
export class RegisterModule { }
