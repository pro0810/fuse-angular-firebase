import { Component, ElementRef, OnInit, ViewChild, Input } from "@angular/core";
import {
  MatPaginator,
  MatSort,
  MatSnackBar,
  MatDialog
} from "@angular/material";
import { FormGroup } from "@angular/forms";
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
import { OrganizationService } from "../organization.service";
import { UserStatus } from "../../user/user.model";
import { OrgUsersFormDialogComponent } from "../org-users-form/org-users-form.component";
import { Organization } from "../organization.model";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

@Component({
  selector: "app-org-user-list",
  templateUrl: "./org-user-list.component.html",
  styleUrls: ["./org-user-list.component.scss"],
  animations: fuseAnimations
})
export class OrgUserListComponent implements OnInit {
  selection = new SelectionModel<string>(true, []);

  userStatus = UserStatus;

  dataSource: UsersDataSource | null;
  displayedColumns = ["checkbox", "photo", "name", "phone", "location"];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("filter") filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  categories: string[];
  selectedCategory: string;

  dialogRef: any;

  @Input() organization: Organization;

  constructor(
    private orgService: OrganizationService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.categories = ["all", "emg"];

    this.dataSource = new UsersDataSource(
      this.orgService,
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
    // this.selection.selected.forEach(user => {
    //     this.userListService.deleteUser(user).then(() => {
    //         this.selection.clear();
    //         this.snackBar.open('Operation completed.', null,  {duration: 500});
    //     });
    // });
  }

  onSendMessage(user) {}

  toggleStar(userId) {}

  addUserList() {
    this.dialogRef = this.dialog.open(OrgUsersFormDialogComponent, {
      // panelClass: 'org-users-dialog',
      width: "80%",
      height: "80%",
      data: {
        organization: this.organization
      }
    });

    // this.dialogRef.afterClosed()
    //     .subscribe((response: string[]) => {
    //         if ( !response )
    //         {
    //             return;
    //         }

    //         // this.contactsService.updateContact(response.getRawValue());
    //     });
  }
}

class UsersDataSource extends DataSource<any> {
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
    private orgService: OrganizationService,
    private _paginator: MatPaginator,
    private _sort: MatSort
  ) {
    super();
  }

  connect(): Observable<any[]> {
    const displayDataChanges = [
      this.orgService.onOrgChanged,
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange,
      this._categoryChange
    ];

    return Observable.merge(...displayDataChanges).pipe(
      switchMap(() => {
        return this.orgService.getUserList(this.orgService.org.id).pipe(
          switchMap(response => {
            // console.log (response)
            // var userList = response.users || [];

            // data = this.filterDataByCategory(userList, this.category);

            var data = this.filterData(response);

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
    return FuseUtils.filterArrayByString(data, this.filter);
  }

  filterDataByCategory(data: any[], category: string) {
    if (!this.category || this.category === "all") {
      return data;
    }

    return data.filter(item => item.status === UserStatus.NEED_HELP);
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
        case "phone":
          [propertyA, propertyB] = [a.phone, b.phone];
          break;
        case "location":
          [propertyA, propertyB] = [a.email, b.email];
          break;
        case "status":
          [propertyA, propertyB] = [a.status, b.status];
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
