import { Pipe, PipeTransform } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import { DB_NAME } from "../../app.constants";

@Pipe({
  name: "UsersBelongsTo"
})
export class UsersBelongsToPipe implements PipeTransform {
  constructor(private afs: AngularFirestore) {}

  transform(orgId: string, args?: any): any {
    return this.afs
      .collection(`${DB_NAME.USERS}`, ref =>
        ref.where("belongsTo", "==", orgId)
      )
      .valueChanges();
  }
}
