import { Injectable } from "@angular/core";
import { CanLoad, Router, Route } from "@angular/router";
import { Observable } from "rxjs/Observable";
import { map, take, tap } from "rxjs/operators";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuardService implements CanLoad {
  constructor(private router: Router, private authService: AuthService) {}

  canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.checkPermission.pipe(
      take(1),
      tap(auth => {
        if (!auth) {
          this.router.navigate(["/login"]);
        }
      })
    );
  }
}
