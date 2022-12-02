import { Injectable } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import * as firebase from "firebase";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot
} from "@angular/router";
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { DB_NAME } from "../../../app.constants";
import { AuthService } from "../auth/auth.service";
import { switchMap, tap } from "rxjs/operators";

export enum CoordinatorStatus {
  NORMAL = 0,
  AWAY,
  ACTIVE
}

@Injectable()
export class CoordinatorListService implements Resolve<any> {
  onCoordinatorsChanged: BehaviorSubject<any> = new BehaviorSubject({});

  constructor(
    private afs: AngularFirestore,
    private authService: AuthService
  ) {}

  /**
   * Resolve
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    // return this.getCoordinators();
  }

  getCoordinators(): Observable<any> {
    const curUser = firebase.auth().currentUser;
    return this.authService.isAdmin.pipe(
      switchMap(isAdmin =>
        isAdmin
          ? this.afs.doc(`${DB_NAME.ADMIN}/${curUser.uid}`).valueChanges()
          : this.afs.doc(`${DB_NAME.COORS}/${curUser.uid}`).valueChanges()
      ),
      switchMap((admin: any) => {
        if (admin.belongsTo) {
          return this.afs
            .collection(`${DB_NAME.COORS}`, ref =>
              ref.where("belongsTo", "==", admin.belongsTo)
            )
            .valueChanges();
        } else {
          return this.afs.collection(`${DB_NAME.COORS}`).valueChanges();
        }
      })
    );
  }

  deleteCoordinator(zone: any) {
    return this.afs.doc(`${DB_NAME.ZONES}/${zone.zone_id}`).delete();
  }
}
