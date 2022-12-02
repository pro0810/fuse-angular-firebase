import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  ViewChildren,
  OnDestroy,
  Input,
  ElementRef
} from "@angular/core";
import { NgForm } from "@angular/forms";
import { FusePerfectScrollbarDirective } from "@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive";
import { ChatService } from "../chat.service";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import * as firebase from "firebase";
import { DB_NAME } from "../../../../app.constants";
import { EmergencyService } from "../../emergency/emergency.service";

@Component({
  selector: "app-chat-view",
  templateUrl: "./chat-view.component.html",
  styleUrls: ["./chat-view.component.scss"]
})
export class ChatViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  user: any;
  chat: any;
  dialog: any[] = [];
  contact: any;
  replyInput: any;
  isIndividual: boolean = false;
  roomId: string;
  isLoaded: boolean = false;
  onChatSelected: Subscription;
  messagesRef: any;
  from: string; // from USERS, EMERG
  @ViewChild(FusePerfectScrollbarDirective)
  directiveScroll: FusePerfectScrollbarDirective;
  @ViewChildren("replyInput") replyInputField;
  @ViewChild("replyForm") replyForm: NgForm;
  @Input() getParamsData: any;

  constructor(
    private chatService: ChatService,
    private router: Router,
    private emergService: EmergencyService
  ) {}

  ngOnInit() {
    setTimeout(() => {
    this.scrollToBottom();
    })
    this.user = this.chatService.user;
    this.onChatSelected = this.chatService.onChatSelected.subscribe(contact => {
      if (contact) {
        this.contact = contact;
        this.roomId = this.chatService.getGeneratedRoomId(
          this.user.id,
          contact.id
        );
        this.dialog = [];
        this.isLoaded = false;
        this.trackMessages();
        this.loadMessages();
        this.readyToReply();
      }
    });
    this.chatService.onChatFrom.subscribe(from => {
      this.from = from;
    });
  }

  ngOnDestroy() {
    if (this.onChatSelected) {
      this.onChatSelected.unsubscribe();
    }

    if (this.messagesRef) {
      this.messagesRef.off();
    }
  }

  ngAfterViewInit() {
    this.replyInput = this.replyInputField.first.nativeElement;
    this.readyToReply();
  }



  onClickBack() {
    this.router.navigate([this.from]);
  }

  loadMessages() {
    this.chatService.loadDialog(this.roomId).then(snapshot => {
      this.dialog = [];
      snapshot.forEach(childSnapshot => {
        var childKey = childSnapshot.key;
        var childData = childSnapshot.val();
        if (childData["emerId"] === this.getParamsData.emerId) {
          this.isIndividual = true;
        }
        this.dialog.push(childData);
        if (
          childData["emrId"] !== this.getParamsData.emerId &&
          this.dialog.length !== 0
        ) {
          this.isIndividual = true;
        }
      });
      this.isLoaded = true;
      setTimeout(() => {
      this.scrollToBottom();
      });
      // clear
      if (this.dialog.length > 0)
        this.chatService.clearUnreadCount(this.user.id, this.roomId);
    });
  }

  trackMessages() {
    var messagesAddedEvent = snapshot => {
      let message = snapshot.val();
      if (this.isLoaded) {
        var found = this.dialog.find(element => {
          return element.id === message.id;
        });
        if (!found) {
          this.dialog.push(message);
        }

        this.scrollToBottom();
      }
    };

    var messagesRemovedEvent = snapshot => {
      if (this.isLoaded) {
        var isExist = false;
        var index = -1;
        for (var i = 0; i < this.dialog.length; i++) {
          var existMessage = this.dialog[i];
          const message = snapshot.val();
          if (message.id == existMessage.id) {
            isExist = true;
            index = i;
            break;
          }
        }

        if (isExist) {
          this.dialog.splice(index, 1);
          this.scrollToBottom();
        }
      }
    };

    this.messagesRef = firebase
      .database()
      .ref(`${DB_NAME.CHAT_MSGES}`)
      .child(this.roomId)
      .orderByChild("timestamp");
    this.messagesRef.on("child_added", messagesAddedEvent);
    this.messagesRef.on("child_removed", messagesRemovedEvent);
  }

  selectContact() {
    this.chatService.selectContact(this.contact);
  }

  readyToReply() {
    setTimeout(() => {
      this.replyForm.reset();
      this.focusReplyInput();
      this.scrollToBottom();
    });
  }

  focusReplyInput() {
    setTimeout(() => {
      this.replyInput.focus();
    });
  }

  // scrollToBottom(speed?: number) {
  //   speed = speed || 400;
    
  //   if (this.directiveScroll) {
  //     this.directiveScroll.update();
  //     setTimeout(() => {
  //       console.log("===================");
  //       this.directiveScroll.scrollToBottom(0, speed);
  //     });
  //   }
  // }

  scrollToBottom(){
    try {
      console.log("===================");
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { console.log(err)}                 
}

  reply(event) {
    var content = this.replyForm.form.value.message;
    
    if (content != null) {
      content = content.replace(/\s*$/, "");
      this.sendSMS(content);
    }
  }

  onComposeMessage(type, content, media) {
    var ref = firebase
      .app()
      .database()
      .ref()
      .child(DB_NAME.CHAT_MSGES)
      .child(this.roomId)
      .push();
    var messageId = ref.key;
    const message = {
      id: messageId,
      content: content,
      timestamp: Date.now(),
      media: "",
      type: type,
      isRead: false,
      sender: {
        id: this.user.id,
        name: this.user.name,
        photo: this.user.photo || ""
      }
      // emerId: this.getParamsData.emerId
    };
    this.chatService
      .updateInUserTable(
        this.getParamsData["userId"],
        this.isIndividual,
        this.getParamsData.emerId
      )
      .then();

    if (type == 0) {
      // text
      this.chatService
        .sendMessage(this.roomId, message, [this.contact])
        .then(response => {
          this.readyToReply();
        });
    } else if (type == 1) {
      // media
      this.dialog.push(message);
      this.scrollToBottom();
      const name = messageId + ".png";
      const metadata = { contentType: media.type };
      const ref = firebase
        .storage()
        .ref()
        .child("Messages")
        .child(name);
      ref
        .child(name)
        .put(media, metadata)
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => {
          message.media = url;
          this.chatService
            .sendMessage(this.roomId, message, [this.contact])
            .then(response => {
              this.readyToReply();
            });
        });
    } else {
    }
  }

  onFileChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.onComposeMessage(1, "Shared Photo", file);
      };
    }
  }

  sendSMS(msg): boolean {
    
    let emergencyService = this.emergService;
    
    if (emergencyService.emergency == null) {
      this.readyToReply();
      return true;
    }
    
    let userId = this.contact.id;
    console.log("---------------",msg, userId)
    var userSub = emergencyService
      .getUserFromId(emergencyService.emergency.id, userId)
      .subscribe(data => {
        if (data.sms_time != null && data.sms_time != 0) {
          // emergencyService.sendSMS(data.phone, msg, error => {});
        } else {
          this.onComposeMessage(0, msg, null);
        }
        userSub.unsubscribe();
      });
    this.readyToReply();
    return true;
  }
}
