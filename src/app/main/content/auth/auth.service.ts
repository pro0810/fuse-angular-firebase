import { Injectable } from "@angular/core";
import { AngularFireAuth } from "angularfire2/auth";
import { AngularFirestore } from "angularfire2/firestore";
import * as firebase from "firebase/app";
import { Observable } from "rxjs/Observable";
import { DB_NAME } from "../../../app.constants";
import { Coordinator } from "../coordinator/coordinator.model";
import { Organization } from "../organization/organization.model";
import { UserService } from "../user/user.service";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

export enum AuthStatus {
  DENIED = 0,
  ADMIN,
  COORDINATOR
}

@Injectable()
export class AuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private userService: UserService
  ) {}

  /**
   * firebase auth state
   */
  get authState() {
    return this.afAuth.authState;
  }

  /**
   * firebase current user
   */
  get firebaseUser() {
    return this.afAuth.auth.currentUser;
  }

  get currentUser() {
    return this.afAuth.authState.pipe(
      switchMap(auth => {
        if (!auth) {
          return of(null);
        }
        // return this.userService.getCoordinatorById(auth.uid);
        return of(firebase.auth().currentUser);
      })
    );
  }

  get isAdmin(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      switchMap(auth => {
        if (!auth) {
          return of(false);
        }

        return this.afs
          .doc(`${DB_NAME.ADMIN}/${auth.uid}`)
          .valueChanges()
          .take(1)
          .pipe(
            switchMap(response => {
              if (response != null) {
                return of(true);
              } else {
                return of(false);
              }
            })
          );
      })
    );
  }

  /**
   * Googleplus Authentication
   */
  signInWithGoogleplus(): Promise<any> {
    return this.afAuth.auth.signInWithPopup(
      new firebase.auth.GoogleAuthProvider()
    );
  }

  /**
   * Email Authentication
   *
   * @param email
   * @param password
   */
  signInWithEmailAndPassword(email: string, password: string): Promise<any> {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  registerWithEmailAndPassword(
    orgName: string,
    orgLocation: any,
    name: string,
    email: string,
    password: string
  ): Promise<any> {
    return this.afAuth.auth
      .createUserWithEmailAndPassword(email, password)
      .then(res => {
        let user = firebase.auth().currentUser;
        var organization = new Organization();
        organization.id = this.afs.createId();
        organization.name = orgName;
        organization.location.lat = orgLocation.lat;
        organization.location.lng = orgLocation.lng;
        organization.ownerId = user.uid;
        
        return this.afs
          .doc(`${DB_NAME.ORGAS}/${organization.id}`)
          .set({ ...organization })
          .then(response => {
            return this.saveUserToFireStore(name, organization);
          })
          .catch(error => {
            return error;
          });
      });
  }

  saveUserToFireStore(name: string, org: any) {
    var coordinator = new Coordinator();
    coordinator.id = this.firebaseUser.uid;
    coordinator.email = this.firebaseUser.email;
    coordinator.name = name;
    coordinator.belongsTo = org.id;
    const organization = new Organization(org);
    organization.coordinators.push({
      id: coordinator.id,
      name: coordinator.name
    });
    this.afs.doc(`${DB_NAME.ORGAS}/${org.id}`).update({ ...organization });

    return this.afs
      .doc(`${DB_NAME.COORS}/${this.firebaseUser.uid}`)
      .set({ ...coordinator });
  }

  get authenticated(): boolean {
    return this.authState !== null;
  }

  get checkPermission(): Observable<boolean> {
    return this.authState.pipe(
      switchMap(auth => {
        if (!auth) {
          return of(false);
        } else {
          return of(true);
        }
      })
    );
  }

  /**
   * Sign out
   */
  signOut(): Promise<any> {
    return this.afAuth.auth.signOut();
  }
}
