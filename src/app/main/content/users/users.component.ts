import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import {
  MatPaginator,
  MatSort,
  MatSnackBar,
  MatDialog
} from "@angular/material";
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

import { UserListService } from "./user-list.service";
import { UserStatus } from "../user/user.model";
import { Router } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

@Component({
  selector: "app-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.scss"],
  animations: fuseAnimations
})
export class UsersComponent implements OnInit {
  selection = new SelectionModel<string>(true, []);
  userStatus = UserStatus;
  dataSource: UsersDataSource | null;
  displayedColumns = [
    "checkbox",
    "photo",
    "name",
    "phone",
    "location",
    "message",
    "enrolled"
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("filter") filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  categories: string[];
  selectedCategory: string;
  dialogRef: any;
  isAdmin: boolean = false;
  constructor(
    private authService: AuthService,
    private router: Router,
    private userListService: UserListService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {
    this.authService.isAdmin.subscribe(value => {
      this.isAdmin = value;
      if (value) {
        this.displayedColumns = [
          "checkbox",
          "photo",
          "name",
          "org",
          "phone",
          "location",
          "message",
          "enrolled"
        ];
      } else {
        this.displayedColumns = [
          "checkbox",
          "photo",
          "name",
          "phone",
          "location",
          "message",
          "enrolled"
        ];
      }
    });
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

  deleteSelected() {
    this.selection.selected.forEach(user => {
      console.log(user)
      this.userListService.deleteUser(user).then(() => {
        this.selection.clear();
        this.snackBar.open("Operation completed.", null, { duration: 500 });
      });
    });
  }

  onSendMessage(user) {
    this.router.navigate(["users/chats"], {
      queryParams: {
        userId: user.id,
        name: user.name,
        photo: user.photo,
        from: "/users"
      }
    });
  }

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
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange,
      this._categoryChange
    ];

    return Observable.merge(...displayDataChanges).pipe(
      switchMap(() => {
        return this.userListService.getUserList().pipe(
          switchMap(data => {
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
        case "org":
          [propertyA, propertyB] = [a.belongsTo, b.belongsTo];
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
