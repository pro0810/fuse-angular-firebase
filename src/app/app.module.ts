import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes } from "@angular/router";
import { MatMomentDateModule } from "@angular/material-moment-adapter";
import { MatButtonModule, MatIconModule } from "@angular/material";
import { TranslateModule } from "@ngx-translate/core";
import "hammerjs";

import { FuseModule } from "@fuse/fuse.module";
import { FuseSharedModule } from "@fuse/shared.module";
import { FuseSidebarModule, FuseThemeOptionsModule } from "@fuse/components";

import { fuseConfig } from "app/fuse-config";

import { AppComponent } from "app/app.component";
import { LayoutModule } from "app/layout/layout.module";

import { LoginModule } from "./main/content/auth/login/login.module";

import { AngularFireModule } from "angularfire2";
import { AngularFireAuthModule } from "angularfire2/auth";
import { AngularFirestoreModule } from "angularfire2/firestore";
import { AuthGuardService } from "./main/content/auth/auth-guard.service";
import { environment } from "environments/environment";
import { DBService } from "app/services/db.service";

import { MessagingService } from "app/services/messaging.service";
import { AngularFireDatabaseModule } from "angularfire2/database";
import { RegisterModule } from "./main/content/auth/register/register.module";
import { UserService } from "./main/content/user/user.service";
import { ForgotPasswordModule } from "./main/content/auth/forgot-password/forgot-password.module";
const appRoutes: Routes = [
  {
    path: "",
    redirectTo: "emergencies",
    pathMatch: "full"
  },
  {
    path: "users",
    canLoad: [AuthGuardService],
    loadChildren: "./main/content/users/users.module#UsersModule"
  },
  {
    path: "coordinators",
    canLoad: [AuthGuardService],
    loadChildren:
      "./main/content/coordinators/coordinators.module#CoordinatorsModule"
  },
  {
    path: "orgs",
    canLoad: [AuthGuardService],
    loadChildren:
      "./main/content/organizations/organizations.module#OrganizationsModule"
  },
  {
    path: "emergencies",
    canLoad: [AuthGuardService],
    loadChildren:
      "./main/content/emergencies/emergencies.module#EmergenciesModule"
  },

  {
    path: "**",
    redirectTo: "404"
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes),

    TranslateModule.forRoot(),

    // Material moment date module
    MatMomentDateModule,

    // Material
    MatButtonModule,
    MatIconModule,

    // Fuse modules
    FuseModule.forRoot(fuseConfig),
    FuseSharedModule,
    FuseSidebarModule,
    FuseThemeOptionsModule,

    // App modules
    LayoutModule,

    HttpClientModule,
    LoginModule,
    RegisterModule,
    ForgotPasswordModule,

    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireDatabaseModule
  ],
  providers: [AuthGuardService, DBService, MessagingService, UserService],
  bootstrap: [AppComponent]
})
export class AppModule {}
