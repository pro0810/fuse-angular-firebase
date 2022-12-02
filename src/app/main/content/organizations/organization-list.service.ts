
import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import * as firebase from 'firebase';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { HttpHeaders, HttpClient } from '@angular/common/http';

import { DB_NAME } from '../../../app.constants';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class OrganizationListService implements Resolve<any> {

    constructor( private afs: AngularFirestore, private authService: AuthService ) {
        
    }

    /**
     * Resolve
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        // return this.getOrgList();
    }

    getOrganizations(): Observable<any>
    {
        const curUser = firebase.auth().currentUser; 
        return this.authService.isAdmin.pipe(
            switchMap(isAdmin => isAdmin ? this.afs.doc(`${DB_NAME.ADMIN}/${curUser.uid}`).valueChanges()
                                         : this.afs.doc(`${DB_NAME.COORS}/${curUser.uid}`).valueChanges()),
            switchMap((admin:any) => {
                if (admin.belongsTo) {
                    return this.afs.collection(`${DB_NAME.ORGAS}`, ref => ref.where('id', '==', admin.belongsTo)).valueChanges();
                } else {
                    return this.afs.collection(`${DB_NAME.ORGAS}`).valueChanges();
                }
            }));
    }

    deleteOrg(org): Promise<void> {
        return this.afs.doc(`${DB_NAME.ORGAS}/${org.id}`).delete();
    }

    saveOrg(org): Promise<void> {
        if (org.id) {
            return this.afs.doc(`${DB_NAME.ORGAS}/${org.id}`).update({...org});
        }
    }
}
