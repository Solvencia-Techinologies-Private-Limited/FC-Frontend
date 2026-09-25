import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TenantService {

  constructor(
    public http: HttpClient
  ) {}

  getTenantList(payload: any) {
    return this.http.post('https://f209f1bd-471d-4776-93e9-feb62ee31516.mock.pstmn.io/api/gpmaster/locations/search/CPXEU_UK?mock=3', payload);
  }
}
