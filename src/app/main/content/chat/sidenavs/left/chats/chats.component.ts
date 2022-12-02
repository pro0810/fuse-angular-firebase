import { Component, OnInit } from "@angular/core";
import { ObservableMedia } from "@angular/flex-layout";

import { fuseAnimations } from "@fuse/animations";
import { FuseMatSidenavHelperService } from "@fuse/directives/fuse-mat-sidenav/fuse-mat-sidenav.service";

import { ChatService } from "../../../chat.service";
import { UserListService } from "../../../../users/user-list.service";

@Component({
  selector: "app-chat-chats-sidenav",
  templateUrl: "./chats.component.html",
  styleUrls: ["./chats.component.scss"],
  animations: fuseAnimations
})
export class ChatsComponent implements OnInit {
  user: any;
  chats: any[] = [];
  contacts: any[] = [];
  chatSearch: any;
  searchText = "";

  constructor(
    private chatService: ChatService,
    private fuseMatSidenavService: FuseMatSidenavHelperService,
    public media: ObservableMedia
  ) {
    this.chatSearch = {
      name: ""
    };
  }

  ngOnInit() {
    this.chatService.getUser().subscribe(user => {
      this.user = user;
    });

    this.chatService.getContacts().subscribe(contacts => {
      this.contacts = contacts;
    });
  }

  showChatDiglog(contact) {
    const contactData = {
      id: contact.id,
      name: contact.name,
      photo: contact.photo || ""
    };

    this.chatService.onChatSelected.next(contactData);

    if (!this.media.isActive("gt-md")) {
      this.fuseMatSidenavService.getSidenav("chat-left-sidenav").toggle();
    }
  }

  setUserStatus(status) {
    this.chatService.setUserStatus(status);
  }

  getUserStatus(contact): string {
    if (contact.status == 0) {
      return "online";
    } else if (contact.status == 1) {
      return "do-not-disturb";
    } else {
      return "away";
    }
  }

  getUserMood(contact): string {
    if (contact.status == 0) {
      return "I'm okay";
    } else if (contact.status == 1) {
      return "I need help";
    } else {
      return "Saved";
    }
  }

  getUserChat(contact) {
    var userChat = null;
    if (this.user) {
      for (var i = 0; i < this.user.chatList.length; i++) {
        const chat = this.user.chatList[i];
        const contactUser = this.getContact(chat);
        if (contactUser != null) {
          userChat = chat;
          break;
        }
      }
    }

    return userChat;
  }

  getContact(chat): any {
    var user = null;
    for (var i = 0; i < chat.users.length; i++) {
      let chatUser = chat.users[i];
      if (chatUser.id != this.user.id) {
        user = chatUser;
        break;
      }
    }
    return user;
  }

  changeLeftSidenavView(view) {
    this.chatService.onLeftSidenavViewChanged.next(view);
  }

  logout() {}
}
