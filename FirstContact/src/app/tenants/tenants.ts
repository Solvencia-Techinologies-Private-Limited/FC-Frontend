import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tenants',
  imports: [],
  templateUrl: './tenants.html',
  styleUrl: './tenants.css',
})
export class Tenants {

  constructor(private router: Router) {}


  openProduct(): void {
    this.router.navigate(['/product']);
  }
}
