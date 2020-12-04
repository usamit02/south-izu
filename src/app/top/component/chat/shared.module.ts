import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ChatComponent } from './chat.component';
import { ReactComponent } from './react/react.component';
import { SendComponent } from '../send/send.component';
import { EmojiComponent } from '../send/emoji/emoji.component';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

import { SafePipe } from './pipe/safe.pipe';
import { DatePipe } from './pipe/date.pipe';
import { MediaPipe } from './pipe/media.pipe';
@NgModule({
  imports: [CommonModule, IonicModule, FormsModule, PickerModule],
  declarations: [ChatComponent, ReactComponent, SendComponent, EmojiComponent, SafePipe, DatePipe, MediaPipe,],
  entryComponents: [ReactComponent, EmojiComponent,],
  exports: [ChatComponent, ReactComponent, SendComponent, EmojiComponent,SafePipe,]
})
export class ChatSharedModule { }