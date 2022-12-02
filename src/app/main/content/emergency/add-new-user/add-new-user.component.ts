import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { EmergencyService } from "../emergency.service";
import { MatTableDataSource } from "@angular/material/table";
import { SelectionModel } from "@angular/cdk/collections";
import { AngularFireFunctions } from "angularfire2/functions";

@Component({
  selector: "app-add-new-user",
  templateUrl: "./add-new-user.component.html",
  styleUrls: ["./add-new-user.component.scss"]
})
export class AddNewUserComponent implements OnInit {
  @Input() emergency;
  displayedColumns: string[] = ["Check_box", "Name", "Phone"];
  dataSource: any;
  newList: any = [];
  selection = new SelectionModel<any>(true, []);
  alreadyExisting: any = [];
  @Output() sendToggleEvent = new EventEmitter();
  constructor(
    public emergencyService: EmergencyService,
    private afFun: AngularFireFunctions
  ) {}

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.emergencyService
      .loadAllUserList(this.emergency.orgId)
      .then(querySnapshot => {
        let usersList = [];
        querySnapshot.forEach(doc => {
          const userData = doc.data();
          usersList.push({
            id: userData.id,
            name: userData.name,
            photo: userData.photo,
            phone: userData.phone
          });
        });
        this.removeDuplicates(usersList, this.emergency.users);
      });
  }

  addEmergency() {
    const user = this.selection.selected;
    this.alreadyExisting = [];
    this.emergency.users.forEach(x => this.alreadyExisting.push(x));
    user.forEach(y =>
      this.alreadyExisting.push({
        id: y["id"],
        name: y["name"],
        photo: y["photo"]
      })
    );
    this.getUnique(this.alreadyExisting, "id");
    this.emergencyService.addSingleUser(this.emergency, this.alreadyExisting);
    setTimeout(() => {
      this.onLoad();
      this.sendToggleEvent.emit(false);
    }, 2000);
  }

  checkUserExistOrNot(users) {
    const emrUser = this.emergency.users;
    const checkArr = [...emrUser, ...users];
    this.getUnique(checkArr, "id");
  }

  getUnique(arr, comp) {
    const unique = arr
      .map(e => e[comp])
      .map((e, i, final) => final.indexOf(e) === i && i)
      .filter(e => arr[e])
      .map(e => arr[e]);
    this.alreadyExisting = unique;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(row?: any) {
    if (!row) {
      return `${this.isAllSelected() ? "select" : "deselect"} all`;
    }
    return `${
      this.selection.isSelected(row) ? "deselect" : "select"
    } row ${row.position + 1}`;
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  removeDuplicates(main, secondary) {
    if (main && secondary) {
      for (let i = 0; i < main.length; i++) {
        for (let j = 0; j < secondary.length; j++) {
          if (main[i]["id"] === secondary[j]["id"]) {
            main.splice(i, 1);
            this.newList = main;
            this.dataSource = new MatTableDataSource(this.newList);
          }
        }
      }
    }
  }
}
