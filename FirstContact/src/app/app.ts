import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TenantSelection } from './tenant-selection/tenant-selection.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TenantSelection],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('FirstContact');
}
