import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Tenants } from './tenants/tenants';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Tenants],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('FirstContact');
}
