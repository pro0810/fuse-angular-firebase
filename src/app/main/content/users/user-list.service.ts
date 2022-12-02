import { Injectable } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import * as firebase from "firebase";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot
} from "@angular/router";
import { Observable } from "rxjs/Observable";
import { switchMap, map } from "rxjs/operators";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { HttpHeaders, HttpClient } from "@angular/common/http";

import { DB_NAME } from "../../../app.constants";
import { AuthService } from "../auth/auth.service";
import { AngularFireDatabase } from "angularfire2/database";

@Injectable()
export class UserListService implements Resolve<any> {
  user: any;
  onUsersChanged: BehaviorSubject<any> = new BehaviorSubject({});

  constructor(
    private afs: AngularFirestore,
    private db: AngularFireDatabase,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    // return this.getCoreUsers();
  }

  getUser(): Observable<any> {
    const curUser = firebase.auth().currentUser;
    return this.authService.isAdmin.pipe(
      switchMap(isAdmin =>
        isAdmin
          ? this.afs.doc(`${DB_NAME.ADMIN}/${curUser.uid}`).valueChanges()
          : this.afs.doc(`${DB_NAME.COORS}/${curUser.uid}`).valueChanges()
      ),
      map((user: any) => {
        if (user.id) {
          user.chatList = this.db
            .list(`${DB_NAME.CHAT_ROOMS}/${user.id}`)
            .valueChanges();
        }
        this.user = user;
        return this.user;
      })
    );
  }

  getUserList(): Observable<any> {
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
            .collection(`${DB_NAME.USERS}`, ref =>
              ref.where("belongsTo", "==", admin.belongsTo)
            )
            .valueChanges();
        } else {
          return this.afs.collection(`${DB_NAME.USERS}`).valueChanges();
        }
      })
    );
  }

  getIdleBelongToOrgUsers() {
    return this.afs
      .collection(`${DB_NAME.USERS}`, ref => ref.where("belongsTo", "==", "?"))
      .valueChanges();
  }

  saveUser(user) {
    if (user.id) {
      return this.afs.doc(`${DB_NAME.USERS}/${user.id}`).update({ ...user });
    }
  }

  deleteUser(user: any) {
    return this.afs.doc(`${DB_NAME.USERS}/${user.id}`).delete();
  }

  deleteCollection() {
    firebase
      .firestore()
      .collection("Users")
      .get()
      .then(function(documents) {
        documents.forEach(function(doc) {
          doc.ref.delete();
        });
      })
      .catch(function(e) {});
  }
}
