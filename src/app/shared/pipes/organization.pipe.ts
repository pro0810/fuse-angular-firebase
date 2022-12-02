import { Pipe, PipeTransform } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import { DB_NAME } from "../../app.constants";

@Pipe({
  name: "organization"
})
export class OrganizationPipe implements PipeTransform {
  constructor(private afs: AngularFirestore) {}

  transform(orgId: string, args?: any): any {
    return this.afs.doc(`${DB_NAME.ORGAS}/${orgId}`).valueChanges();
  }
}
