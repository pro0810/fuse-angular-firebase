import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { OrgUserListComponent } from './org-user-list/org-user-list.component';
import { OrgCoordinatorListComponent } from './org-coordinator-list/org-coordinator-list.component';
import { CommonModule } from '@angular/common';

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

import { FuseSharedModule } from '@fuse/shared.module';
import { SharedModule } from '../../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { OrgUsersFormDialogComponent } from './org-users-form/org-users-form.component';
import { UserListService } from '../users/user-list.service';
  
const routes = [
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),

    CommonModule,

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

  ],
  declarations: [
    OrgUserListComponent,
    OrgCoordinatorListComponent,
    OrgUsersFormDialogComponent
  ],
  providers: [
    UserListService
  ],
  entryComponents: [
    OrgUsersFormDialogComponent
  ],
  exports: [
    OrgUserListComponent,
    OrgCoordinatorListComponent
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class OrganizationModule { }
