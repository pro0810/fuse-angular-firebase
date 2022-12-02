import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NumberOnlyDirective } from "./number.directive";
import { PipesModule } from "./pipes/pipes.module";

@NgModule({
  imports: [CommonModule, PipesModule],
  declarations: [NumberOnlyDirective],
  exports: [NumberOnlyDirective, PipesModule]
})
export class SharedModule {}
