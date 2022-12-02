import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit
} from "@angular/core";
import { MatPaginator, MatSort, MatSnackBar } from "@angular/material";
import { DataSource } from "@angular/cdk/collections";
import { SelectionModel } from "@angular/cdk/collections";

import "rxjs/add/operator/startWith";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/map";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/observable/fromEvent";
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

import { fuseAnimations } from "@fuse/animations";
import { FuseUtils } from "@fuse/utils";

import { EmergencyListService } from "./emergency-list.service";
import { Router } from "@angular/router";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

@Component({
  selector: "app-emergencies",
  templateUrl: "./emergencies.component.html",
  styleUrls: ["./emergencies.component.scss"],
  animations: fuseAnimations
})
export class EmergenciesComponent implements OnInit {
  selection = new SelectionModel<string>(true, []);

  dataSource: EmergencyListDataSource | null;
  displayedColumns = [
    "checkbox",
    "status",
    "name",
    "description",
    "notified",
    "IamOK",
    "need_help",
    "acknow",
    "response",
    "startedAt",
    "endedAt",
    "actions"
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("filter") filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  categories: string[];
  selectedCategory: string;

  constructor(
    private dataService: EmergencyListService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.categories = ["all", "active"];

    this.sort.active = "startedAt";
    this.sort.direction = "desc";

    this.dataSource = new EmergencyListDataSource(
      this.dataService,
      this.paginator,
      this.sort
    );
    Observable.fromEvent(this.filter.nativeElement, "keyup")
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }

  filterByCategory(category: string) {
    this.dataSource.category = this.selectedCategory = category;

    setTimeout(() => {
      if (
        !this.dataSource.filteredData ||
        !this.dataSource.filteredData.length
      ) {
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
      return (
        this.selection.selected.length === this.dataSource.filteredData.length
      );
    } else {
      return (
        this.selection.selected.length === this.dataSource.filteredData.length
      );
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
      this.dataSource.filteredData.forEach(data => {
        this.selection.select(data);
      });
    }
  }

  // deleteSelected() {
  // this.selection.selected.forEach((emg: any) => {
  //   this.dataService.deleteEmergency(emg.id).then(() => {
  //     this.selection.clear();
  //     this.snackBar.open("Operation completed.", null, { duration: 500 });
  //   });
  //   this.dataService.deleteLocation(emg.id);
  // });
  // }

  deleteSelected() {
    this.selection.selected.forEach((emg: any) => {
      emg.users.forEach(user => {
        this.dataService.firstDeleteUsers(emg.id, user.id).then(res => {
          this.dataService.deleteEmergency(emg.id).then(() => {
            this.selection.clear();
            this.snackBar.open("Operation completed.", null, { duration: 500 });
          });
        });
      });
      this.dataService.deleteLocation(emg.id);
    });
  }

  onSendMessage(user) {}

  onActions(emergency) {
    if (emergency.active) {
      let dataService = this.dataService;
      dataService.setActiveEmergency(emergency.id, false);

      let emergSub = dataService
        .trackEmergency(emergency.id)
        .subscribe(emergInfo => {
          if (emergInfo != null) {
            let users = emergInfo.users;
            let msg =
              "Emergency Over. The emergency " +
              emergInfo.name +
              " is now over.";

            users.forEach(user => {
              var userSub = dataService
                .getUserFromId(emergency.id, user.id)
                .subscribe(userInfo => {
                  if (userInfo != undefined && userInfo != null) {
                    // dataService.sendSMS(userInfo.phone, msg, error => {});
                  }
                  userSub.unsubscribe();
                });
            });
            /*
                let users = emergInfo.users;
                let smsResponse = emergInfo.smsResponse || [];
                let msg = 'The emergency ' + emergInfo.name +' is now over.';

                users.forEach((user) => {
                    var info = null;
                    for (var i = 0; i < smsResponse.length; i++) {
                        if (smsResponse[i].id == user.id) {
                            info = smsResponse[i];
                            break;
                        }
                    }
                    if (info != null && info.sms_time != null) {
                        var userSub = dataService.getSelectUser(user.id).subscribe(userInfo => {
                            dataService.sendSMS(userInfo.phone, msg, (error) => {
                                    
                            });
                            userSub.unsubscribe();
                        });
                    }
                });
                */
          }
          emergSub.unsubscribe();
        });
    } else {
      let dataService = this.dataService;
      dataService.setActiveEmergency(emergency.id, true);
      let emergSub = dataService
        .trackEmergency(emergency.id)
        .subscribe(emergInfo => {
          if (emergInfo != null) {
            let users = emergInfo.users;
            let msg =
              "The emergency is " +
              emergInfo.name +
              ". Please respond with your status";

            users.forEach(user => {
              var userSub = dataService
                .getUserFromId(emergency.id, user.id)
                .subscribe(userInfo => {
                  //  if (userInfo != undefined && userInfo != null && userInfo.sms_time != null) {
                  if (userInfo != undefined && userInfo != null) {
                    // dataService.sendSMS(userInfo.phone, msg, error => {});
                  }
                  userSub.unsubscribe();
                });
            });
          }
          emergSub.unsubscribe();
        });
    }
  }

  onClickNewEmergency() {
    this.router.navigate(["/emergencies/new"]);
  }

  onNewEmgergencyWithArea() {
    this.router.navigate(["/emergencies/new"], {
      queryParams: { type: "AREA" }
    });
  }

  onNewEmgergencyWithUsers() {
    this.router.navigate(["/emergencies/new"], {
      queryParams: { type: "USERS" }
    });
  }

  toggleStar(userId) {}
  /*
    getResponseCount(emergency, type) {
        if (emergency == null) {
            return 0;
        }
        if (emergency.type === 'AREA') {
            if (emergency.users.length === 0) {
                return 0;
            }
        }
        
        var count = 0
        const usersStatusReplied = emergency.usersStatusReplied || [];
        for (var i = 0; i < usersStatusReplied.length; i++) {
            if (usersStatusReplied[i].status != null) {
                let status = usersStatusReplied[i].status;
                if (status == type) {
                    count ++;
                }
            }
        }
        return count;
    }

    getNoResponseCount(emergency) {
        if (emergency == null) {
            return 0;
        }
        let usersNotified = emergency.usersNotified || []
        let allCount = usersNotified.length;
        
        if (emergency.type === 'AREA') {
            if (emergency.users.length === 0) {
                return allCount;
            }
        }
        
        var count = 0
        const usersStatusReplied = emergency.usersStatusReplied || [];
        for (var i = 0; i < usersStatusReplied.length; i++) {
            if (usersStatusReplied[i].status != null) {
                let status = usersStatusReplied[i].status;
                if (status != -1) {
                    count ++;
                }
            }            
        }
        return allCount-count;
    }
    */
}

class EmergencyListDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject("");
  _filteredDataChange = new BehaviorSubject("");
  _categoryChange = new BehaviorSubject("");

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
    private dataService: EmergencyListService,
    private _paginator: MatPaginator,
    private _sort: MatSort
  ) {
    super();
    this.filteredData = this.dataService.emergencyList;
  }

  connect(): Observable<any[]> {
    const displayDataChanges = [
      this.dataService.onEmergencyListChanged,
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange,
      this._categoryChange
    ];

    return Observable.merge(...displayDataChanges).pipe(
      switchMap(() => {
        return this.dataService.getEmergencyList().pipe(
          switchMap(data => {
            data = this.filterDataByCategory(data, this.category);

            data = this.filterData(data);

            this.filteredData = [...data];

            data = this.sortData(data);

            const startIndex =
              this._paginator.pageIndex * this._paginator.pageSize;
            return of(data.splice(startIndex, this._paginator.pageSize));
          })
        );
      })
    );
  }

  filterData(data) {
    if (!this.filter) {
      return data;
    }
    var arr = [];
    data.forEach(element => {
      if (FuseUtils.searchInString(element.name, this.filter)) {
        arr.push(element);
      }
    });

    return arr;
    //   return FuseUtils.filterArrayByString(data, this.filter);
  }

  filterDataByCategory(data: any[], category: string) {
    if (!this.category || this.category === "all") {
      return data;
    }

    return data.filter(item => item.active === true);
  }

  sortData(data): any[] {
    if (!this._sort.active || this._sort.direction === "") {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number | string = "";
      let propertyB: number | string = "";

      switch (this._sort.active) {
        case "name":
          [propertyA, propertyB] = [a.name, b.name];
          break;
        // case 'need_help':
        //     [propertyA, propertyB] = [a.need_help, b.need_help];
        //     break;
        // case 'status':
        //     [propertyA, propertyB] = [a.status, b.status];
        //     break;
        case "startedAt":
          [propertyA, propertyB] = [a.startedAt, b.startedAt];
          break;
        case "endedAt":
          [propertyA, propertyB] = [a.endedAt, b.endedAt];
          break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (
        (valueA < valueB ? -1 : 1) * (this._sort.direction === "asc" ? 1 : -1)
      );
    });
  }

  disconnect() {}
}
