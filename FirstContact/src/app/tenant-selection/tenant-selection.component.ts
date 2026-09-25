import { Component, inject, OnInit, signal } from '@angular/core';
import { TenantService } from './tenant.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tenant-selection',
  imports: [CommonModule],
  templateUrl: './tenant-selection.component.html',
  styleUrl: './tenant-selection.component.scss',
})
export class TenantSelection implements OnInit {

  public tenantDetails = signal<any[]>([]);
  public tenantService = inject(TenantService);

  getTenantPayload = {
    pageNo: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortDirection: "DESC",
    searchTerm: null
  }

  ngOnInit() {
    this.tenantService.getTenantList(this.getTenantPayload).subscribe({
      next: (res: any) => {
        const tenantlist = res?.data?.locationList;
        this.tenantDetails.set(tenantlist);
       }, error: (error: HttpErrorResponse) => {
        
       }
    })
  }
  
}
