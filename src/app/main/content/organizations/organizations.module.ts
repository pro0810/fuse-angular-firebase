import { NgModule } from '@angular/core';

import { RouterModule } from '@angular/router';

import { CdkTableModule } from '@angular/cdk/table';
import { 
  MatButtonModule, 
  MatChipsModule, 
  MatFormFieldModule, 
  MatIconModule, 
  MatInputModule, 
  MatPaginatorModule, 
  MatRippleModule, 
  MatSelectModule, 
  MatSnackBarModule,
  MatSortModule, 
  MatTableModule, 
  MatTabsModule, 
  MatCheckboxModule,
  MatMenuModule,
  MatToolbarModule,
  MatDialogModule} from '@angular/material';

import { SharedModule } from '../../../shared/shared.module';
import { AgmCoreModule } from '@agm/core';
import { FuseSharedModule } from '@fuse/shared.module';
import { OrganizationsComponent } from './organizations.component';
import { OrganizationListService } from './organization-list.service';
import { OrganizationComponent } from '../organization/organization.component';
import { OrganizationService } from '../organization/organization.service';
import { OrganizationModule } from '../organization/organization.module';


const routes = [
  {
      path     : '',
      component: OrganizationsComponent,
      resolve  : {
        data: OrganizationListService
      }
  },
  {
      path    : ':id',
      component : OrganizationComponent,
      resolve : {
          data: OrganizationService
      }   
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),

    FuseSharedModule,

    CdkTableModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatRippleModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatDialogModule,
    SharedModule,

    AgmCoreModule.forRoot({
        apiKey: 'AIzaSyCUkQGJqSh-AOPsw2mEG4xW2NBXM4yvrKs'
    }),

    OrganizationModule

  ],
  declarations: [
    OrganizationsComponent,
    OrganizationComponent
  ],
  providers: [
    OrganizationListService,
    OrganizationService
  ],
  entryComponents: []
})
export class OrganizationsModule { }
