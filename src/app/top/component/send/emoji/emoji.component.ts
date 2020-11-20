import { Component, OnInit } from '@angular/core';
import { SendService } from '../send.service';
@Component({
  selector: 'app-emoji',
  templateUrl: './emoji.component.html',
  styleUrls: ['./emoji.component.scss'],
})
export class EmojiComponent implements OnInit {

  constructor(private send: SendService, ) { }

  ngOnInit() { }
  addEmoji(e) {
    this.send.emoji.next(e.emoji.native);
  }
}
