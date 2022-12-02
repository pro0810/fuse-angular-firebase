import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FuseSharedModule } from "@fuse/shared.module";

import { FuseContentComponent } from "app/main/content/content.component";
import { ZoneComponent } from "./zone/zone.component";

@NgModule({
  declarations: [FuseContentComponent, ZoneComponent],
  imports: [RouterModule, FuseSharedModule],
  exports: [FuseContentComponent]
})
export class FuseContentModule {}
