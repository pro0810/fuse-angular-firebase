import { Pipe, PipeTransform, Injectable } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import { DB_NAME } from "../../app.constants";

@Injectable({ providedIn: "root" })
@Pipe({
  name: "user"
})
export class UserPipe implements PipeTransform {
  constructor(private afs: AngularFirestore) {}
  transform(userId: string, args?: any): any {
    if (args != null) {
      return this.afs
        .doc(`${DB_NAME.EMERG}/${args}/${DB_NAME.USER}/${userId}`)
        .valueChanges();
    }
    return this.afs.doc(`${DB_NAME.USERS}/${userId}`).valueChanges();
  }
}
