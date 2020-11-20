import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { AngularFireDatabase } from '@angular/fire/database';
import { UiService } from '../../service/ui.service';
import { CalendarComponentOptions } from 'ion2-calendar';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit, OnDestroy {
  dateRange: { from: string; to: string; };
  type: 'string'; // 'string' | 'js-date' | 'moment' | 'time' | 'object'
  optionsRange: CalendarComponentOptions = {
    pickMode: 'range',from: new Date(), to: new Date().setMonth(new Date().getMonth()+1),
    weekdays: ['日', '月', '火', '水', '木', '金', '土'],
    monthPickerFormat:['１月','２月','３月','４月','５月','６月','７月','８月','９月','１０月','１１月','１２月'],
    monthFormat: 'YYYY年M月',weekStart:1
  };
  startDay:Date;
  endDay:Date;
  private onDestroy$ = new Subject();
  constructor(public modalCtrl: ModalController, private db: AngularFireDatabase, private ui: UiService,) { }
  ngOnInit() {
  
  }
  calendarStart(e){
    console.log(e);
    this.startDay=new Date(e.time);
    if(!this.endDay){
      this.endDay=new Date(e.time);
    }
    let a=0;
  }
  calendarEnd(e){
    console.log(e);
    this.endDay=new Date(e.time);
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
