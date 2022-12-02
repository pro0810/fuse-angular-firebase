import {
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
  Input
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn
} from "@angular/forms";

import { Subscription } from "rxjs/Subscription";

import { fuseAnimations } from "@fuse/animations";
import { FuseUtils } from "@fuse/utils";

import { Location } from "@angular/common";
import {
  parse,
  format,
  AsYouType,
  isValidNumber,
  parseNumber
} from "libphonenumber-js";
import { invalid } from "moment";

import {
  MatPaginator,
  MatSort,
  MatSnackBar,
  MatDialog,
  MatTabChangeEvent
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
import { CoordinatorStatus } from "../../coordinators/coordinator-list.service";
import { OrganizationService } from "../organization.service";
import { Organization } from "../organization.model";

@Component({
  selector: "app-org-coordinator-list",
  templateUrl: "./org-coordinator-list.component.html",
  styleUrls: ["./org-coordinator-list.component.scss"],
  animations: fuseAnimations
})
export class OrgCoordinatorListComponent implements OnInit {
  // -----> coordinators
  selection = new SelectionModel<string>(true, []);

  coordinatorStatus = CoordinatorStatus;

  coordinatordataSource: CoordinatorsDataSource | null;
  coordinatorColumns = ["checkbox", "photo", "name", "email"];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("filter") filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  categories: string[];
  selectedCategory: string;
  dialogRef: any;
  // -----> coordinators

  @Input() organization: Organization;

  constructor(private orgService: OrganizationService) {}

  ngOnInit() {
    this.categories = ["all", "active"];

    this.coordinatordataSource = new CoordinatorsDataSource(
      this.orgService,
      this.paginator,
      this.sort
    );
    Observable.fromEvent(this.filter.nativeElement, "keyup")
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.coordinatordataSource) {
          return;
        }
        this.coordinatordataSource.filter = this.filter.nativeElement.value;
      });
  }

  //   -----> coordinators
  filterByCategory(category: string) {
    this.coordinatordataSource.category = this.selectedCategory = category;

    setTimeout(() => {
      if (
        !this.coordinatordataSource.filteredData ||
        !this.coordinatordataSource.filteredData.length
      ) {
        this.selection.clear();
      }
    });
  }

  isAllSelected(): boolean {
    if (!this.coordinatordataSource) {
      return false;
    }

    if (this.selection.isEmpty()) {
      return false;
    }

    if (this.filter.nativeElement.value) {
      return (
        this.selection.selected.length ===
        this.coordinatordataSource.filteredData.length
      );
    } else {
      return (
        this.selection.selected.length ===
        this.coordinatordataSource.filteredData.length
      );
    }
  }

  masterToggle() {
    if (!this.coordinatordataSource) {
      return;
    }

    if (this.isAllSelected()) {
      this.selection.clear();
    } else if (this.filter.nativeElement.value) {
      this.coordinatordataSource.filteredData.forEach(data =>
        this.selection.select(data)
      );
    } else {
      this.coordinatordataSource.filteredData.forEach(data =>
        this.selection.select(data)
      );
    }
  }

  unBlockSelected() {}

  deleteSelected() {
    this.selection.selected.forEach(user => {
      // this.org.deleteCoordinator(user).then(() => {
      //     this.selection.clear();
      //     this.snackBar.open('Operation completed.', null,  {duration: 500});
      // });
    });
  }

  onSendMessage(user) {}

  toggleStar(userId) {}

  addNewCoordinator() {}
  //   -----> coordinators
}

class CoordinatorsDataSource extends DataSource<any> {
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
    private dataService: OrganizationService,
    private _paginator: MatPaginator,
    private _sort: MatSort
  ) {
    super();
    this.filteredData = this.dataService.coordinators;
  }

  connect(): Observable<any[]> {
    const displayDataChanges = [
      this.dataService.onOrgChanged,
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange,
      this._categoryChange
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      let data = this.dataService.coordinators.slice();

      data = this.filterDataByCategory(data, this.category);

      data = this.filterData(data);

      this.filteredData = [...data];

      data = this.sortData(data);

      // Grab the page's slice of data.
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      return data.splice(startIndex, this._paginator.pageSize);
    });
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

    return data.filter(item => item.appliedLoan === true);
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
