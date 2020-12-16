import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Platform,IonSlides } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireFunctions } from '@angular/fire/functions';
import { UserService } from '../../service/user.service';
import { UiService } from '../../service/ui.service';
import { APIURL } from '../../../environments/environment';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {  
  @ViewChild('slides', { static: false }) slides: IonSlides;
  imgs:Array<Object>=[];
  txt:string="";
  txts:Array<string>=['山と川に囲まれた農村の片隅','管理棟','炊事場（予定地）','１０ほどのサイト','敷地面積1500㎡']
  slideOpts = {
    initialSlide: 0, speed: 500, loop: true, slidesPerView: 1,
    autoplay: { delay: 3000,}
  }
  count;
  private onDestroy$ = new Subject();
  constructor(private router:Router,private db: AngularFireDatabase, private userService: UserService, private ui: UiService,
     private functions: AngularFireFunctions,private platform:Platform) { }

  ngOnInit() {
    for(let i=1;i<6;i++){
      this.imgs.push({url:`${APIURL}img/tab1/${i}.jpg`,txt:this.txts[i]});
    }   
  }  
  slideChange(e){
    this.slides.getActiveIndex().then(i=>{
      if(i===0){
        i=4;
      }else if(i===6){
        i=0;
      }else{
        i--;
      }
      this.txt=this.txts[i];this.count=i;
    });
  }
  onScrollEnd(){
    console.log('scroll end');
  }
  onScrolling(){
    console.log('scrolling');
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
