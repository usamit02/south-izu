import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormControl, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { UiService } from '../../service/ui.service';
import { ApiService } from '../../service/api.service';
import { UserService } from '../../service/user.service';
import { User } from '../../class';
import { APIURL } from '../../../environments/environment';
import { MouseEvent, LatLngBounds, Marker } from '@agm/core';
import { MarkerComponent } from '../../component/marker/marker.component';
@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page implements OnInit, OnDestroy {
  IMGURL = APIURL + 'img/tab3/';
  lat: number = 34.68503331;
  lng: number = 138.85154339;
  mylat: number = 34.65316927;
  mylng: number = 138.82476422;
  zoom: number = 12;
  infoWindowOpened: any;
  markers: Array<Marker>;
  user: User;
  private debounceTimer = null;
  private onDestroy$ = new Subject();
  constructor(private db: AngularFirestore, private ui: UiService, private api: ApiService, private modal: ModalController,
    private userService: UserService,) { }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
      this.user = user;
    });
  }
  onBoundsChange(bounds: LatLngBounds) {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }    
    this.debounceTimer = setTimeout(() => {
      const nlat = bounds.getNorthEast().lat();
      const nlng = bounds.getNorthEast().lng();
      const slat = bounds.getSouthWest().lat();
      const slng = bounds.getSouthWest().lng();
      this.api.get('map', { nlat: nlat, nlng: nlng, slat: slat, slng: slng }).then(res => {
        this.markers=[];
        for(let i=0;i<res.markers.length;i++){
          delete res.markers[i].len;
          res.markers[i].label=(i+1).toString();
          this.markers.push(res.markers[i]);
        }
      })
    }, 1000);
  }
  mapClicked($event: MouseEvent) {

  }
  async mapRightClicked($event: MouseEvent) {
    const confirm = await this.ui.confirm('マーカー登録', '登録しますか');
    if (confirm) {
      const modal = await this.modal.create({
        component: MarkerComponent, componentProps: { prop: { 
          marker:{user: this.user.id, id: 0, lat: $event.coords.lat, lng: $event.coords.lng,na:"",txt:"",phone:"",url:"" ,img:APIURL+'img/noimg.jpg',simg:APIURL+'img/noimgs.jpg'}} }
      })
      return await modal.present().then(() => {
        modal.onDidDismiss().then(event => {
          this.lat = $event.coords.lat; this.lng = $event.coords.lng;
          if (event.data) {
            //this.undo(event.data);//this.castimg = event.data.castimg; this.shopimg = event.data.shopimg;          
          }
        });
      });
    }
  }
  async markerUpdate(marker) {
    if (this.user.admin || marker.user== this.user.id) {
      delete marker.label;
      const modal = await this.modal.create({
        component: MarkerComponent, componentProps: { prop: { marker:marker } }
      })
      return await modal.present().then(() => {
        modal.onDidDismiss().then(event => {
          this.lat = marker.lat; this.lng = marker.lng;
          if (event.data) {
            //this.undo(event.data);//this.castimg = event.data.castimg; this.shopimg = event.data.shopimg;          
          }
        });
      });
    }
  }
  clickedMarker(label: string, infoWindow: any, index: number) {
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
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
interface marker {
  lat: number;
  lng: number;
  label?: string;
  draggable?: boolean;
  na: string;
  txt: string;
  img?: string;
}