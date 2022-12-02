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
import { HttpClient } from "@angular/common/http";

import { DB_NAME } from "../../../app.constants";

@Injectable()
export class CoordinatorService implements Resolve<any> {
  routeParams: any;
  coordinator: any;
  onCoordinatorChanged: BehaviorSubject<any> = new BehaviorSubject({});

  constructor(private afs: AngularFirestore, private http: HttpClient) {}

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
    this.routeParams = route.params;

    return new Promise((resolve, reject) => {
      Promise.all([this.getCoordinator()]).then(() => {
        resolve();
      }, reject);
    });
  }

  getCoordinator(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.routeParams.id === "new") {
        this.onCoordinatorChanged.next(false);
        resolve(false);
      } else {
        this.afs
          .doc(`${DB_NAME.COORS}/${this.routeParams.id}`)
          .valueChanges()
          .take(1)
          .subscribe(response => {
            this.coordinator = response;
            this.onCoordinatorChanged.next(this.coordinator);
            resolve(response);
          }, reject);
      }
    });
  }

  saveCoordinator(coordinator) {
    if (coordinator.id) {
      return this.afs
        .doc(`${DB_NAME.COORS}/${coordinator.id}`)
        .update({ ...coordinator });
    }
  }

  addCoordinator(data) {
    const name = data.name;
    const email = data.email;
    const pswd = data.password;
    const orgId = data.organization.id;

    var params = { email: email, password: pswd, name: name, orgId: orgId };

    var registerCoordinator = firebase
      .functions()
      .httpsCallable("registerCoordinator");
    return registerCoordinator(params);
  }

  deleteCoordinator(coordinator) {
    // return this.afs.doc(`${DB_NAME.COORS}/${user.id}`).delete();
  }

  get newId() {
    return this.afs.createId();
  }
}
