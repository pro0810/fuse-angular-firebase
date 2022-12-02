import { NgModule } from "@angular/core";

import { UsersComponent } from "./users.component";
import { UserListService } from "./user-list.service";
import { UserComponent } from "../user/user.component";
import { UserService } from "../user/user.service";
import { RouterModule } from "@angular/router";
import { CdkTableModule } from "@angular/cdk/table";
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
  MatDialogModule,
  MatProgressBarModule
} from "@angular/material";

import { SharedModule } from "../../../shared/shared.module";
import { AgmCoreModule } from "@agm/core";
import { FuseSharedModule } from "@fuse/shared.module";
import { EmergencyService } from "../emergency/emergency.service";
import { BulkUserComponent } from "../user/bulk-user/bulk-user.component";

const routes = [
  {
    path: "",
    component: UsersComponent,
    resolve: {
      data: UserListService
    }
  },
  {
    path: "chats",
    loadChildren: "../chat/chat.module#ChatModule"
  },
  {
    path: ":id",
    component: UserComponent,
    resolve: {
      data: UserService
    }
  }
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
    MatProgressBarModule,

    SharedModule,

    AgmCoreModule.forRoot({
      apiKey: "AIzaSyCUkQGJqSh-AOPsw2mEG4xW2NBXM4yvrKs"
    })
  ],
  declarations: [UserComponent, UsersComponent, BulkUserComponent],
  providers: [UserListService, UserService, EmergencyService],
  entryComponents: []
})
export class UsersModule {}
