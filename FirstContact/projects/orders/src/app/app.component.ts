import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', '../styles.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class AppComponent {

  constructor() {
    console.log('AppComponent (orders MFE Root) instantiated');
  }
}
