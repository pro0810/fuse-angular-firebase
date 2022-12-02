import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CoordinatorsComponent } from "./coordinators.component";
import { CoordinatorListService } from "./coordinator-list.service";
import { CoordinatorComponent } from "../coordinator/coordinator.component";
import { CoordinatorService } from "../coordinator/coordinator.service";
import { ZoneComponent } from "../zone/zone.component";
import { ZoneService } from "../zone/zone.service";

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
  MatProgressBarModule,
  MatDialogModule
} from "@angular/material";

import { SharedModule } from "../../../shared/shared.module";
import { AgmCoreModule } from "@agm/core";
import { FuseSharedModule } from "@fuse/shared.module";

const routes = [
  {
    path: "",
    component: CoordinatorsComponent,
    resolve: {
      data: CoordinatorListService
    }
  },
  {
    path: "add_zone",
    component: ZoneComponent,
    resolve: {
      data: ZoneService
    }
  },
  {
    path: ":id",
    component: CoordinatorComponent,
    resolve: {
      data: CoordinatorService
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
  declarations: [CoordinatorsComponent, CoordinatorComponent, ZoneComponent],
  providers: [CoordinatorListService, CoordinatorService, ZoneService],
  entryComponents: []
})
export class CoordinatorsModule {}
