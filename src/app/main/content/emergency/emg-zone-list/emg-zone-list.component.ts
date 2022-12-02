import { Component, OnInit, ViewChild } from "@angular/core";
import { SelectionModel } from "@angular/cdk/collections";
import { fuseAnimations } from "@fuse/animations";
import { EmergencyService } from "../emergency.service";
import { ZoneListService } from "../../coordinators/zone-list.service";
import { ZoneService } from "../../zone/zone.service";
import { AuthService } from "../../auth/auth.service";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
@Component({
  selector: "app-emg-zone-list",
  templateUrl: "./emg-zone-list.component.html",
  styleUrls: ["./emg-zone-list.component.scss"],
  animations: fuseAnimations
})
export class EmgZoneListComponent implements OnInit {
  selection = new SelectionModel<string>(true, []);
  items: Array<any>;
  dataSource: any;
  displayedColumns = ["checkbox", "name", "description"];
  isAdmin: boolean = false;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  constructor(
    public emergencyService: EmergencyService,
    public ZoneDATAService: ZoneListService,
    private zoneService: ZoneService,
    private authService: AuthService
  ) {
    this.authService.isAdmin.subscribe(value => {
      this.isAdmin = value;
    });
  }

  ngOnInit() {
    this.zoneService.getOrganization().subscribe(orgList => {
      this.getData(orgList[0].id);
    });
  }

  applyFilter(filterValue) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getData(orgID) {
    this.ZoneDATAService.getZone().subscribe(result => {
      const x = result.map(item => {
        return {
          active: item["active"],
          zone_description: item["zone_description"],
          zone_name: item["zone_name"],
          orgId: item["orgId"],
          zone_id: item["zone_id"],
          area: item["area"]
        };
      });
      // const x = result
      if (!this.isAdmin) {
        const y = [];
        x.forEach(item => {
          if (item["orgId"] === orgID) {
            y.push(item);
          }
        });
        this.tableFunction(y);
      } else {
        this.tableFunction(x);
      }
    });
  }

  tableFunction(result) {
    this.items = result.sort(function(a, b) {
      return a["zone_name"].localeCompare(b["zone_name"]);
    });
    this.dataSource = this.items;
    this.dataSource = new MatTableDataSource(this.items);
    this.dataSource.paginator = this.paginator;
  }

  isAllSelected() {
    if (this.items) {
      const numSelected = this.selection.selected.length;
      const numRows = this.items.length;
      return numSelected === numRows;
    }
  }

  userToggle(user) {
    this.selection.toggle(user);
    this.onSelectedZone(user);
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.items.forEach(row => {
        this.selection.select(row);
        this.onSelectedZone(row);
      });
    }
  }

  checkboxLabel(row): string {
    if (!row) {
      return `${this.isAllSelected() ? "select" : "deselect"} all`;
    }
    return `${
      this.selection.isSelected(row) ? "deselect" : "select"
    } row ${row.position + 1}`;
  }

  onSelectedZone(user) {
    this.emergencyService.onZoneListUpdated.next(this.selection.selected);
  }
}
