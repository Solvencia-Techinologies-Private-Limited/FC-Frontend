import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, shareReplay } from 'rxjs';
import { ContactProduct, parseProducts, Product } from './product-modal.model'

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly jsonUrl = '/product_UK.json';
  private products$: Observable<ContactProduct[]>;

  constructor(private http: HttpClient) {
    this.products$ = this.http
      .get('assets/products.json')
      .pipe(map(parseProducts), shareReplay(1));
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.jsonUrl);
  }

   getByName(name: string): Observable<ContactProduct | undefined> {
    return this.products$.pipe(
      map((list) =>
        list.find((p) => p.brandName.toLowerCase() === name.toLowerCase())
      )
    );
  }

  getSeriesList(params?: any, stockType?: string): Observable<any> {
    // const body = {
    //   tenantId: params,
    //   searchTerm: '',
    //   pageNo: 1,
    //   stockType: stockType,
    //   pageSize: 300,
    //   sortBy: 'name',
    //   sortDirection: 'ASC',
    // };
    // // const editionCode = `${this.envService.environment.productEditionCode}`;
    return this.http.post(
      'https://f209f1bd-471d-4776-93e9-feb62ee31516.mock.pstmn.io/api/gpmaster/catalog/getallseries/CPXUS_US',
      params
    );
  }
}