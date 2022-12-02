import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FuseSharedModule } from "@fuse/shared.module";
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

import { EmergenciesComponent } from "./emergencies.component";
import { EmergencyListService } from "./emergency-list.service";
import { EmergencyService } from "../emergency/emergency.service";
import { EmergencyComponent } from "../emergency/emergency.component";
import { AgmCoreModule } from "@agm/core";
import { EmergencyModule } from "../emergency/emergency.module";
import { SharedModule } from "../../../shared/shared.module";

const routes = [
  {
    path: "",
    component: EmergenciesComponent,
    resolve: {
      data: EmergencyListService
    }
  },
  {
    path: "chats",
    loadChildren: "../chat/chat.module#ChatModule"
  },
  {
    path: ":id",
    component: EmergencyComponent,
    resolve: {
      data: EmergencyService
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
    MatRadioModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyCUkQGJqSh-AOPsw2mEG4xW2NBXM4yvrKs"
    }),

    EmergencyModule,
    SharedModule
  ],
  declarations: [EmergencyComponent, EmergenciesComponent],
  providers: [EmergencyService, EmergencyListService],
  entryComponents: []
})
export class EmergenciesModule {}
