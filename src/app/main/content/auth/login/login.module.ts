import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FuseSharedModule } from "@fuse/shared.module";
import {
  MatButtonModule,
  MatCheckboxModule,
  MatFormFieldModule,
  MatInputModule
} from "@angular/material";
import { LoginComponent } from "./login.component";
import { AuthService } from "../auth.service";
import { AuthGuardService } from "../auth-guard.service";
const routes = [
  {
    path: "login",
    component: LoginComponent
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
  declarations: [LoginComponent],
  providers: [AuthService, AuthGuardService]
})
export class LoginModule {}
