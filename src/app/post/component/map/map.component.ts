import { Component, OnChanges, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { Marker } from '../marker/marker.component';
import { MARKERICON } from '../../../config';
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnChanges {
  @Input() typ: string;
  @Input() parent: number;
  @Input() markers: Array<Marker>;
  @Input() travelMode: string;
  //@Output() saved = new EventEmitter();
  lat: number = 34.68503331;
  lng: number = 138.85154339;
  openedWindow: number = 1;
  marker: Marker;
  icon = MARKERICON;
  //origin" [destination]="destination" [waypoints]="waypoints"
  origin: any; destination: any; waypoints: any[];
  constructor(private api: ApiService, private ui: UiService,) { }
  ngOnInit() {
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.parent) {
      this.api.get('query', { select: ['id', 'latlng', 'na', 'txt', 'img', 'icon', 'idx'], table: 'story_marker', where: { typ: this.typ, parent: this.parent } }).then(res => {
        this.undo(res.story_markers);
      });
    } else if (changes.markers) {
      this.undo(this.markers);
    }
  }
  undo(markers: Marker[]) {
    this.markers = markers;
    if (markers.length) {
      this.lat = markers[0].lat; this.lng = markers[0].lng;
      if (markers.length > 1) {
        this.origin = { lat: markers[0].lat, lng: markers[0].lng };
        this.destination = { lat: markers[markers.length - 1].lat, lng: markers[markers.length - 1].lng };
        let ways = markers.slice(1, markers.length);
        this.waypoints = ways.map(way => {
          return { location:{lat: way.lat, lng: way.lng }};
        });
      }
    }
  }
  markerClick(marker) {

  }
  markerRightClick(marker) {

  }
  mouseOver(e, marker) {

  }
  openWindow(id) {
    this.openedWindow = id;
  }
  isInfoWindowOpen(id) {
    return this.openedWindow == id;
  }
}
