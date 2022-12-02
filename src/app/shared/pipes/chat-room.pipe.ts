import { Pipe, PipeTransform } from "@angular/core";
import { DB_NAME } from "../../app.constants";
import { AngularFireDatabase } from "angularfire2/database";
import * as firebase from "firebase";

@Pipe({
  name: "chatRoom"
})
export class ChatRoomPipe implements PipeTransform {
  constructor(private db: AngularFireDatabase) {}

  transform(userId: string, args?: any): any {
    const fireUser = firebase.auth().currentUser;
    const roomId = this.getGeneratedRoomId(fireUser.uid, userId);
    return this.db
      .object(`${DB_NAME.CHAT_ROOMS}/${fireUser.uid}/${roomId}`)
      .valueChanges();
  }

  getGeneratedRoomId(publisherId, subscriberId): string {
    if (publisherId < subscriberId) {
      return publisherId + "_" + subscriberId;
    } else {
      return subscriberId + "_" + publisherId;
    }
  }
}
