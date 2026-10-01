import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, map, Observable, shareReplay } from 'rxjs';
import { ContactProduct, parseProducts, Product } from './product-modal.model'

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly jsonUrl = '/Product_US.json';
  private products$: Observable<ContactProduct[]>;

  constructor(private http: HttpClient) {
    this.products$ = this.http
      .get<unknown>(this.jsonUrl)
      .pipe(
        map((response) => parseProducts(response as Product[]) as ContactProduct[]),
        shareReplay(1)
      );
  }

  getProducts(): Observable<Product[]> {
  return this.http
    .get<any[]>('/Product_US.json')
    .pipe(
      map(products =>
        products.map(item => ({
          brandName: item['0_BrandName'],
          baseCurve: item['1_BaseCurve'],
          sphere: item['2_Sphere'],
          cylinder: item['3_Cylinder'],
          axis: item['4_Axis'],
          diameter: item['5_Diameter'],
          imageFileName: item['7_ImageFileName'],
          wearingSchedule: item['8_WearingSchedule'],
          trialUnitCount: item['9_TrialUnitCount']
        }))
      )
    );
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