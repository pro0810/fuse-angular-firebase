import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  Inject
} from "@angular/core";
import {
  MatPaginator,
  MatSort,
  MatSnackBar,
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  _MatFormFieldMixinBase
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
import { UserStatus, User } from "../../user/user.model";
import { UserListService } from "../../users/user-list.service";
import { OrganizationService } from "../organization.service";
import { Organization } from "../organization.model";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

@Component({
  selector: "app-org-users-form",
  templateUrl: "./org-users-form.component.html",
  styleUrls: ["./org-users-form.component.scss"],
  animations: fuseAnimations
})
export class OrgUsersFormDialogComponent implements OnInit {
  selection = new SelectionModel<string>(true, []);

  userStatus = UserStatus;

  dataSource: UsersDataSource | null;
  displayedColumns = [
    "checkbox",
    "photo",
    "name",
    "phone",
    "location",
    "status"
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("filter") filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  categories: string[];
  selectedCategory: string;

  selectedOrg: Organization;

  constructor(
    public dialogRef: MatDialogRef<OrgUsersFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private userListService: UserListService,
    private orgService: OrganizationService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {
    this.selectedOrg = data.organization;
  }

  ngOnInit() {
    this.categories = ["all", "emg"];

    this.dataSource = new UsersDataSource(
      this.userListService,
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

  checkExistUser(userId): boolean {
    var isExist = false;
    for (var i = 0; i < this.selectedOrg.users.length; i++) {
      var userData = this.selectedOrg.users[i];
      if (userData.id == userId) {
        isExist = true;
        break;
      }
    }
    return isExist;
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
    this.selection.selected.forEach(user => {});
  }

  addSelected() {
    var userList: any[] = [];
    this.selection.selected.forEach((user: any) => {
      let newUser = new User(user);
      newUser.belongsTo = this.selectedOrg.id;
      this.userListService.saveUser(newUser);
      userList.push({ id: user.id, name: user.name });
    });

    this.selectedOrg.users = userList;
    this.orgService.saveOrg(this.selectedOrg).then(() => {
      this.snackBar.open("Added Users in Organization.", null, {
        duration: 500
      });
    });
  }

  onSendMessage(user) {}

  toggleStar(userId) {}
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
    private userListService: UserListService,
    private _paginator: MatPaginator,
    private _sort: MatSort
  ) {
    super();
  }

  connect(): Observable<any[]> {
    const displayDataChanges = [
      this.userListService.onUsersChanged,
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange,
      this._categoryChange
    ];

    return Observable.merge(...displayDataChanges).pipe(
      switchMap(() => {
        return this.userListService.getIdleBelongToOrgUsers().pipe(
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
