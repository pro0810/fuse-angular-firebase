import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
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
  MatRadioModule
} from "@angular/material";
import { FuseSharedModule } from "@fuse/shared.module";
import { SharedModule } from "../../../shared/shared.module";
import { RouterModule } from "@angular/router";
import { UserListService } from "../users/user-list.service";
import { EmgUserListComponent } from "./emg-user-list/emg-user-list.component";
import { EmgZoneListComponent } from "./emg-zone-list/emg-zone-list.component";
import { OrganizationService } from "../organization/organization.service";
import { EmgUserFormComponent } from "./emg-user-form/emg-user-form.component";
import { EmgSummaryComponent } from "./emg-sum-list/emg-sum-list.component";
import { EmgBulkMsgComponent } from "./emg-bulk-msg/emg-bulk-msg.component";
import { ChatService } from "../chat/chat.service";
import { AddNewUserComponent } from "./add-new-user/add-new-user.component";
import { AngularFireFunctions } from "angularfire2/functions";
const routes = [];
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
    MatRadioModule
  ],
  declarations: [
    EmgUserListComponent,
    EmgUserFormComponent,
    EmgBulkMsgComponent,
    EmgZoneListComponent,
    EmgSummaryComponent,
    AddNewUserComponent
  ],
  providers: [
    UserListService,
    OrganizationService,
    ChatService,
    AngularFireFunctions
  ],
  entryComponents: [EmgUserFormComponent],
  exports: [
    EmgUserListComponent,
    EmgBulkMsgComponent,
    EmgZoneListComponent,
    EmgSummaryComponent,
    AddNewUserComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EmergencyModule {}
