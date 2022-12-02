import { Injectable } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import { Observable } from "rxjs/Observable";
import { error } from "selenium-webdriver";

export class Role {
  _id: string;
  name: string;
  description?: string;
}

@Injectable()
export class DBService {
  constructor(private afs: AngularFirestore) {}

  getDataFrom(tbl: string): Observable<any> {
    return this.afs
      .collection(tbl)
      .snapshotChanges()
      .map(changes => {
        return changes.map(c => {
          let _id = c.payload.doc.id;
          return { _id, ...c.payload.doc.data() };
        });
      });
  }

  updateData(tbl: string, data: any): Promise<void> {
    if (data._id) {
      return this.afs
        .doc(tbl + "/" + data._id)
        .update(data)
        .catch(error => {});
    } else {
      const pushkey = this.afs.createId();
      const model = { _id: pushkey, ...data };
      return this.afs
        .doc(tbl + "/" + pushkey)
        .set(model)
        .catch(error => {});
    }
  }

  removeData(tbl: string, data: any): Promise<void> {
    return this.afs.doc(tbl + "/" + data._id).delete();
  }
}
