import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { CalendarModal, CalendarModalOptions } from 'ion2-calendar';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit, OnDestroy {
  dateRange: { from: string; to: string; };
  type: 'string'; // 'string' | 'js-date' | 'moment' | 'time' | 'object'
  from: Date = new Date();
  to: Date = new Date();
  stayTyps:Array<StayTyp>=[{title:"キャンプ",stays:[]},{title:"車中泊",stays:[]},{title:"民泊",stays:[]},{title:"コテージ",stays:[]}];
  private onDestroy$ = new Subject();
  constructor(public modalCtrl: ModalController, private db: AngularFireDatabase, private api:ApiService,private ui: UiService,) { }
  ngOnInit() {
    this.api.get('query',{select:['*'],table:'stay'}).then(res=>{
      res.stays.map(stay=>{
        this.stayTyps[stay.typ-1].stays.push(stay);        
      });
    })
  }  
  async openCalendar(stay) {
    let d = new Date();
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: `「${stay.title}」の予約`,
      from: new Date(), to: d.setFullYear(d.getFullYear() + 1),
      weekdays: ['日', '月', '火', '水', '木', '金', '土'],
      closeIcon: true, doneIcon: true,
      monthFormat: 'YYYY年M月', defaultScrollTo: new Date(),weekStart:1
    };
    let myCalendar = await this.modalCtrl.create({
      component: CalendarModal,
      componentProps: { options }
    });
    myCalendar.present();
    myCalendar.onDidDismiss().then(event => {
      this.from = new Date(event.data.from.dateObj);
      this.to = new Date(event.data.to.dateObj.getTime() + 86399000);
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
interface Stay{
  title:string;
  txt:string;
  img:string;
  price:number;
  book:Array<Object>;
}
interface StayTyp{
  title:string;
  txt?:string;
  img?:string;
  stays:Array<Stay>;
}
