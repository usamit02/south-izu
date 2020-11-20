import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SendService {
  emoji = new Subject();//絵文字を投稿窓に書き込む
  mentionWrite = new Subject();//メンションを投稿窓に書き込む
}