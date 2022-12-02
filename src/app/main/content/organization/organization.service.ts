
import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import * as firebase from 'firebase';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { HttpHeaders, HttpClient } from '@angular/common/http';

import * as $ from 'jquery';
import { DB_NAME } from '../../../app.constants';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';


@Injectable()
export class OrganizationService implements Resolve<any> {

    routeParams: any;
    org: any;
    userList: any[] = [];
    coordinators: any[] = [];
    onOrgChanged: BehaviorSubject<any> = new BehaviorSubject({});

    constructor( private afs: AngularFirestore, private http: HttpClient ) {
        
    }

    /**
     * Resolve
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {

        this.routeParams = route.params;

        return new Promise((resolve, reject) => {

            Promise.all([
                this.getOrg()
            ]).then(
                () => {
                    resolve();
                },
                reject
            );
        });
    } 

    getOrg(): Promise<any>
    {
        return new Promise((resolve, reject) => {
            if ( this.routeParams.id === 'new' )
            {
                this.onOrgChanged.next(false);
                resolve(false);
            }
            else
            {
                this.afs.doc(`${DB_NAME.ORGAS}/${this.routeParams.id}`).valueChanges().subscribe(response => {
                        this.org = response;
                        this.coordinators = this.org.coordinators;
                        this.onOrgChanged.next(this.org);
                        resolve(response);
                    }, reject);
            }
        });
    }

    getUserList(orgId): Observable<any>
    {
        return this.afs.collection(`${DB_NAME.USERS}`, ref => ref.where('belongsTo', '==', orgId)).valueChanges().pipe(switchMap(res => {
            this.afs.doc(`${DB_NAME.ORGAS}/${orgId}`).update({'mem_size': res.length});
            return of(res);
        }));
    }

    saveOrg(org)
    {
        if (org.id) {
            return this.afs.doc(`${DB_NAME.ORGAS}/${org.id}`).update({...org});
        }
    }

    addOrg(org)
    {
        return this.afs.doc(`${DB_NAME.ORGAS}/${org.id}`).set({...org});
    }

    deleteOrg(org) 
    {
        return this.afs.doc(`${DB_NAME.ORGAS}/${org.id}`).delete();
    }

    get newId() 
    {
        return this.afs.createId();
    }
}
