import { Component, ElementRef, OnInit, ViewChild, Inject } from '@angular/core';
import { MatPaginator, MatSort, MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA, _MatFormFieldMixinBase } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { DataSource } from '@angular/cdk/collections';
import { SelectionModel } from '@angular/cdk/collections';

import * as firebase from "firebase/app";

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { Observable } from 'rxjs/Observable';
import { take, switchMap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';
import { UserStatus, User } from '../../user/user.model';
import { Emergency } from '../emergency.model';
import { EmergencyService } from '../emergency.service';
import { of } from 'rxjs';


@Component({
  selector: 'app-emg-user-form',
  templateUrl: './emg-user-form.component.html',
  styleUrls: ['./emg-user-form.component.scss'],
  animations : fuseAnimations
})
export class EmgUserFormComponent implements OnInit {

  selection = new SelectionModel<string>(true, []);
  
  userStatus = UserStatus;

  dataSource: UsersDataSource | null;
  displayedColumns = ['checkbox', 'photo', 'name', 'phone', 'location', 'status'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  categories: string[];
  selectedCategory: string;

  selectedEmerg: Emergency;

  constructor(
    public dialogRef: MatDialogRef<EmgUserFormComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
        private dataService: EmergencyService, 
        private snackBar: MatSnackBar, 
        public dialog: MatDialog) 
        { 
            this.selectedEmerg = data.emergency;
        }

  ngOnInit() {
      
    this.categories = [
        'all',
        'emg'
    ];

    this.dataSource = new UsersDataSource(this.dataService, this.selectedEmerg.id, this.paginator, this.sort);
    Observable.fromEvent(this.filter.nativeElement, 'keyup')
            .debounceTime(150)
            .distinctUntilChanged()
            .subscribe(() => {
                if ( !this.dataSource ) {
                    return;
                }
                this.dataSource.filter = this.filter.nativeElement.value;
            });
            
  }

  filterByCategory(category: string) {
    this.dataSource.category = this.selectedCategory = category;

    setTimeout(() => {
      if (!this.dataSource.filteredData || !this.dataSource.filteredData.length) {
          this.selection.clear();
      }
    });
  }

  isAllSelected(): boolean {
    if (!this.dataSource) { 
        return false; 
    }
    
    if (this.selection.isEmpty()) { 
        return false; 
    }

    if (this.filter.nativeElement.value) {
      return this.selection.selected.length === this.dataSource.filteredData.length;
    } else {
      return this.selection.selected.length === this.dataSource.filteredData.length;
    }
  }

  masterToggle() {
    if (!this.dataSource) { 
        return; 
    }

    if (this.isAllSelected()) {
      this.selection.clear();
    } else if (this.filter.nativeElement.value) {
      this.dataSource.filteredData.forEach(data => this.selection.select(data));
    } else {
      this.dataSource.filteredData.forEach(data => this.selection.select(data));
    }
  }

  unBlockSelected() {
    //   this.selection.selected.forEach(user => {
    //       this.userService.unBlockUser(user).then(() => {
    //         this.selection.clear();
    //         this.snackBar.open('Operation completed.', null,  {duration: 500});
    //       });
    //   });
  }

  deleteSelected() {
    this.selection.selected.forEach(user => {
        
    });
  }

  addSelected() 
  {
    this.selection.selected.forEach((user: any) => {
        let userData = {id: user.id, name: user.name, photo: user.photo || ""}
        var isExist = false;
        for (var i=0; i<this.selectedEmerg.users.length; i++) {
            let exist_user = this.selectedEmerg.users[i]
            if (exist_user.id == userData.id) {
                isExist = true
            }
        }

        if (!isExist) this.selectedEmerg.users.push(userData)
    });

    if (this.selectedEmerg.id == '?') {
        this.dialogRef.close([this.selectedEmerg])
    } else {
        this.dialogRef.close([this.selectedEmerg])
        this.dataService.saveEmergency(this.selectedEmerg).then(() => {
            this.snackBar.open('Added Users in Emergency.', null,  {duration: 500});
        });
    }

  }

  onSendMessage(user)
  {

  }

  toggleStar(userId)
  {

  }

}

class UsersDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');
  _filteredDataChange = new BehaviorSubject('');
  _categoryChange = new BehaviorSubject('');

  get filteredData(): any {
      return this._filteredDataChange.value;
  }

  set filteredData(value: any) {
      this._filteredDataChange.next(value);
  }

  get filter(): string {
      return this._filterChange.value;
  }

  set filter(filter: string) {
      this._filterChange.next(filter);
  }

  get category(): string {
    return this._categoryChange.value;
  }

  set category(category: string) {
      this._categoryChange.next(category);
  }

  constructor(
      private dataService: EmergencyService,
      private _emergencyId : string,
      private _paginator: MatPaginator,
      private _sort: MatSort
  ) {
      super();
  }

  connect(): Observable<any[]> {
        const displayDataChanges = [
            this._paginator.page,
            this._filterChange,
            this._sort.sortChange,
            this._categoryChange
        ];

        return Observable.merge(...displayDataChanges).pipe(switchMap(() => {
            return this.dataService.getAllUserList().pipe(switchMap(data => {
    
                data = this.filterDataByCategory(data, this.category);
    
                data = this.filterData(data);
    
                this.filteredData = [...data];
    
                data = this.sortData(data);
    
                const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
                return of(data.splice(startIndex, this._paginator.pageSize));
            }));
    
        }));

        // return Observable.merge(...displayDataChanges).switchMap(() => {
        //     return forkJoin([
        //         this.dataService.getAllUserList().pipe(take(1)),
        //         this.dataService.trackEmergency(this._emergencyId).take(1)
        //     ]).switchMap(results => {
        //         let all_users = results[0];
        //         let emerg = results[1];
        //         let emerg_users = emerg.users;

        //         var data = [];

        //         all_users.forEach(element => {
        //             var isExist = false;
        //             for(var i=0; i<emerg_users.length; i++){
        //                 let emerg_user = emerg_users[i];
        //                 if (element.id == emerg_user.id) {
        //                     isExist = true
        //                     break;
        //                 }
        //             }
                    
        //             if (!isExist)  {
        //                 data.push(element);
        //             }
        //         });

        //         data = this.filterDataByCategory(data, this.category);
    
        //         data = this.filterData(data);
    
        //         this.filteredData = [...data];
    
        //         data = this.sortData(data);
    
        //         const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
        //         return of(data.splice(startIndex, this._paginator.pageSize));
        //     });
        // });
  }

  filterData(data) {
      if ( !this.filter ) {
          return data;
      }
      return FuseUtils.filterArrayByString(data, this.filter);
  }

  filterDataByCategory(data: any[], category: string) {
    if (!this.category || this.category === 'all') {
        return data;
    }

    return data.filter(item => item.status === UserStatus.NEED_HELP);
  }

  sortData(data): any[] {

    if ( !this._sort.active || this._sort.direction === '' )
    {
        return data;
    }

    return data.sort((a, b) => {
        let propertyA: number | string = '';
        let propertyB: number | string = '';

        switch ( this._sort.active )
        {
            case 'name':
                [propertyA, propertyB] = [a.name, b.name];
                break;
            case 'phone':
                [propertyA, propertyB] = [a.phone, b.phone];
                break;
            case 'location':
                [propertyA, propertyB] = [a.email, b.email];
                break;
            case 'status':
                [propertyA, propertyB] = [a.status, b.status];
                break;
        }

        const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
        const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

        return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }

  disconnect() {
  }
}
