import { Component, OnInit,ViewChild, AfterViewInit , OnDestroy } from '@angular/core';
import { FormControl, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { UiService } from '../../service/ui.service';
import { ApiService } from '../../service/api.service';
import { APIURL } from '../../../environments/environment';
import { MouseEvent,LatLngBounds, Marker } from '@agm/core';
@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page implements OnInit, OnDestroy {
  IMGURL=APIURL + 'img/tab3/';
  lat: number = 51.678418;
  lng: number = 7.809007;
  mylat: number = 51.678418;
  mylng: number = 7.809007;
  zoom:number = 8;
  infoWindowOpened:any;
  markers:Array<Marker>;
  private debounceTimer = null;
  private onDestroy$ = new Subject();
  constructor( private db: AngularFirestore, private ui: UiService,private api:ApiService,) { }
  ngOnInit() {
  }
  onBoundsChange(bounds: LatLngBounds) {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.debounceTimer = setTimeout(() => {
      const nlat=bounds.getNorthEast().lat();
      const nlng=bounds.getNorthEast().lng();
      const slat=bounds.getSouthWest().lat();
      const slng=bounds.getSouthWest().lng();
      this.api.get('map',{nlat:nlat,nlng:nlng,slat:slat,slng:slng}).then(res=>{
        this.markers=res.markers;
      })
    },1000);
   }
  mapClicked($event:MouseEvent) {
    
  }
  mapRightClicked($event:MouseEvent) {
    this.ui.confirm('マーカー登録','登録しますか').then(()=>{
      this.api.post('map',{lat:$event.coords.lat,lng:$event.coords.lng,na:'ダミー',txt:'へのへの',img:'1'}).then(res=>{
        this.ui.pop('登録しました。');
      }).catch(err=>{
        this.ui.alert(`登録に失敗しました。${err}`);
      })
    })
  }
  clickedMarker(label: string, infoWindow: any,index: number) {
    console.log(`clicked the marker: ${label || index}`);
    if (this.infoWindowOpened === infoWindow) {
      console.log("window already opened");
      return;
      }
      
      if (this.infoWindowOpened !== null && this.infoWindowOpened !== undefined) {
      this.infoWindowOpened.close();
      }
      this.infoWindowOpened = infoWindow;
  }
  /*
  markers: marker[] = [
	  {lat: 51.673858,lng: 7.815982,label: 'A',na:"弓ヶ浜",txt:"白砂斉唱",img:"1"},
	  {lat: 51.373858,lng: 7.215982, label: 'B',na:"マックスバリュー",txt:"食料、酒、総菜",img:"2"},
	  {lat: 51.723858,lng: 7.895982,label: 'C',na:"銀の湯会館",txt:"日帰り温泉1000円",img:"3" }
  ]*/
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
// just an interface for type safety.
interface marker {
	lat: number;
  lng: number;  
	label?: string;
  draggable?: boolean;
  na:string;
  txt:string;
  img?:string;
}