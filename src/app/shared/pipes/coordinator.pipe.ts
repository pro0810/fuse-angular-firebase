import { Pipe, PipeTransform } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { DB_NAME } from '../../app.constants';

@Pipe({
  name: 'coordinator'
})
export class CoordinatorPipe implements PipeTransform {

  constructor(private afs: AngularFirestore) {

  }

  transform(coordinatorId: string, args?: any): any {
    return this.afs.doc(`${DB_NAME.COORS}/${coordinatorId}`).valueChanges();
  }

}
