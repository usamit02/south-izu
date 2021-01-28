import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '../../../service/store.service';
import { Marker } from '../../../class';
@Component({
  selector: 'app-markers',
  templateUrl: './markers.component.html',
  styleUrls: ['./markers.component.scss'],
})
export class MarkersComponent implements OnInit, OnDestroy { 
  markers: Array<Marker> = [];
  private onDestroy$ = new Subject();
  constructor(private store: Store,) { }//private lenPipe:LenPipe,
  ngOnInit() {
    this.store.select(state => state.markers).pipe(takeUntil(this.onDestroy$)).subscribe(markers => {
      markers=markers.filter(marker=>{return marker.len;});
      this.markers = markers.map(marker => {
        if (!marker.len) {
          marker.distance = "";
        } else if (marker.len < 1) {
          marker.distance = `${Math.round(marker.len * 1000)}m`;
        } else if (marker.len < 100) {
          marker.distance = `${Math.round(marker.len * Math.pow(10, 1) / Math.pow(10, 1))}km`;
        } else {
          marker.distance = `${Math.round(marker.len)}km`;
        }
        return marker;
      });
    });
  }
  naClick(marker) {
    this.store.update(state => ({ ...state, marker: marker }));
  }
  ngOnDestroy() {
    this.onDestroy$.next();
    }
}
