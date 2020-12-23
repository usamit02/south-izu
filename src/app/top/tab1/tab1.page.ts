import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IonSlides } from '@ionic/angular';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { ApiService } from '../../service/api.service';
import { APIURL } from '../../../environments/environment';
import { HOME } from '../../config';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {  
  @ViewChild('slides', { static: false }) slides: IonSlides;
  id:number;
  imgs:Array<Object>=[];
  txt:string="";
  slideOpts = {
    initialSlide: 0, speed: 500, loop: true, slidesPerView: 1,
    autoplay: { delay: 3000,}
  }
  count;
  storys=[];
  private onDestroy$ = new Subject();
  constructor(private api: ApiService,private location:Location,) { }
  ngOnInit() {
    let paths=this.location.path().split('/');
    Object.keys(HOME).forEach(key=>{
      if(HOME[key].path===paths[1]){ 
        this.id=Number(key);
      }
    });
    for(let i=0;i< HOME[this.id].txts.length;i++){
       this.imgs.push({url:`${APIURL}img/tab1/${this.id}/${i+1}.jpg`,txt:HOME[this.id].txts[i]});
    }
    this.api.get('query', { table: 'story', select: ['*'], where: { typ: "home", parent: this.id } }).then(async res => {
      this.storys=res.storys;    
    });      
  }  
  slideChange(e){
    this.slides.getActiveIndex().then(i=>{
      if(i===0){
        i=length-1;
      }else if(i>length){
        i=0;
      }else{
        i--;
      }
      this.txt=HOME[this.id].txts[i];this.count=i;
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
