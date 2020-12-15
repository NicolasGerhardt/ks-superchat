import { Component, OnInit } from '@angular/core';
import { ChatService } from "../../services/chat.service";
import { ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  chat$: Observable<any> | undefined;
  newMsg: string = '';

  constructor(
    public cs: ChatService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const chatId = this.route.snapshot.paramMap.get('id') ?? '';
    const source = this.cs.get(chatId);
    this.chat$ = this.cs.joinUsers(source);
  }

  submit(chatId: string) {
    if(!this.newMsg) {
      return alert('you need to enter something!');
    } else {
      this.cs.sendMessage(chatId, this.newMsg);
      this.newMsg = '';
    }
  }

  trackByCreated(i: any, msg: any) {
    return msg.createdAt;
  }

}
