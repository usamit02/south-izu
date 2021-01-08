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
  markerOptions;
  renderOptions = {
    suppressMarkers: true
  };
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
        let waypoints: any = markers.slice(1, markers.length);
        this.waypoints = waypoints.map(waypoint => {
          return { location: { lat: waypoint.lat, lng: waypoint.lng },stopover:false };
        });/*
        waypoints = waypoints.map(waypoint => {
          return { infoWindow: `<p>${waypoint.na}<p><div>${waypoint.txt}</div><img src="${waypoint.img}"/>`,label:{text:'start'} ,icon: this.icon[waypoint.icon] };
        })
         */
        for (let i=0;i<waypoints.length;i++){
          waypoints[i]= { infoWindow: `<p>${waypoints[i].na}<p><div>${waypoints[i].txt}</div><img src="${waypoints[i].img}"/>`,label:{text:(i+1).toString(),color:'white'}}; 
        }
        this.markerOptions = {
          origin: { infoWindow: `<p>${markers[0].na}<p><div>${markers[0].txt}</div><img src="${markers[0].img}"/>`, label:{text:'発',color:'white'}/*icon: this.icon[markers[0].icon] */},
          waypoints: waypoints,
          destination: { infoWindow: `<p>${markers[markers.length - 1].na}<p><div>${markers[markers.length - 1].txt}</div><img src="${markers[markers.length - 1].img}"/>`,label:{text:'着',color:"white"} /*icon: this.icon[markers[markers.length - 1].icon]*/}
        }
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
