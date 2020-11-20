import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
@Component({
  selector: 'app-react',
  templateUrl: './react.component.html',
  styleUrls: ['./react.component.scss'],
})
export class ReactComponent implements OnInit {

  constructor(private pop: PopoverController, ) { }

  ngOnInit() { }
  addEmoji(e) {
    this.pop.dismiss(e.emoji.native);
  }
}
