import { Component, OnInit, OnDestroy} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '../../../service/store.service';
import { Marker } from '../../../class';
@Component({
  selector: 'app-marker',
  templateUrl: './marker.component.html',
  styleUrls: ['./marker.component.scss'],
})
export class MarkerComponent implements OnInit ,OnDestroy{
  markers:Array<Marker> = [];
  
  private onDestroy$ = new Subject();
  constructor(private store:Store, ) { }
  ngOnInit() {
    this.store.select(state => state.markers).pipe(takeUntil(this.onDestroy$)).subscribe(markers=>{
      this.markers=markers;
    });
  }
  naClick(marker){
    this.store.update(state=>({...state,marker:marker}));
  }
  ngOnDestroy(){
    this.onDestroy$.next();
  }    

}
