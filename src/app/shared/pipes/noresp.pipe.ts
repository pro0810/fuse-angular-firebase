import { Pipe, PipeTransform } from '@angular/core';
import { DB_NAME } from '../../app.constants';
import { AngularFirestore } from 'angularfire2/firestore';
import { UserStatus } from '../../main/content/user/user.model';
import { filter, map } from 'rxjs/operators';

@Pipe({
  name: 'noresp'
})
export class NoRespPipe implements PipeTransform {

  constructor(private afs: AngularFirestore) {

  }

  transform(emergency: any, args?: any): any {
    
    return this.afs.collection(`${DB_NAME.EMERG}/${emergency.id}/${DB_NAME.USER}`, ref => ref.where('belongsTo', '==', emergency.orgId)).valueChanges().pipe(map(users => {
      return users.filter((u: any) => {
        let users = emergency.usersReplied
        for (let i=0,l=users.length; i<l; i++) {
          if (users[i] === u.id) {
            if ((u.sms_time != null && u.sms_time > 0) || u.app_time != null)
              return true;
            break;
          }
        }
        return false;
      });
    }))
  }

}
