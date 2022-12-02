import { Pipe, PipeTransform } from '@angular/core';
import { DB_NAME } from '../../app.constants';
import { AngularFirestore } from 'angularfire2/firestore';
import { UserStatus } from '../../main/content/user/user.model';
import { filter, map } from 'rxjs/operators';

@Pipe({
  name: 'acknow'
})
export class AckNowPipe implements PipeTransform {

  constructor(private afs: AngularFirestore) {

  }

  transform(emergency: any, args?: any): any {
    
    return this.afs.collection(`${DB_NAME.EMERG}/${emergency.id}/${DB_NAME.USER}`, ref => ref.where('status', '==', UserStatus.ACKNOWLEDGED).where('belongsTo', '==', emergency.orgId)).valueChanges().pipe(map(users => {
      return users.filter((u: any) => {
        let users = emergency.usersReplied
        for (let i=0,l=users.length; i<l; i++) {
          if (users[i] === u.id) {
            return true;
          }
        }
        return false;
      });
    }))
  }

}
