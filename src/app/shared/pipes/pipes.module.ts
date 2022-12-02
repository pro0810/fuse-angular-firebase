import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { OrganizationPipe } from "./organization.pipe";
import { CoordinatorPipe } from "./coordinator.pipe";
import { UserPipe } from "./user.pipe";
import { ChatRoomPipe } from "./chat-room.pipe";
import { NeedHelpPipe } from "./need-help.pipe";
import { IamOKPipe } from "./iam-ok.pipe";
import { AckNowPipe } from "./acknow.pipe";
import { NoRespPipe } from "./noresp.pipe";
import { UsersBelongsToPipe } from "./users-belongsto.pipe";

@NgModule({
  imports: [CommonModule],
  declarations: [
    OrganizationPipe,
    CoordinatorPipe,
    UserPipe,
    ChatRoomPipe,
    NeedHelpPipe,
    IamOKPipe,
    AckNowPipe,
    NoRespPipe,
    UsersBelongsToPipe
  ],
  exports: [
    OrganizationPipe,
    CoordinatorPipe,
    UserPipe,
    ChatRoomPipe,
    NeedHelpPipe,
    IamOKPipe,
    AckNowPipe,
    NoRespPipe,
    UsersBelongsToPipe
  ]
})
export class PipesModule {}
