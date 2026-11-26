import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_URL } from '../config';
import {
  Category,
  CreatedProduct,
  DeletedProduct,
  ListQuery,
  Product,
  ProductInput,
  ProductsResponse,
} from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/products`;

  /**
   * One method, three endpoints. Search wins over category because DummyJSON
   * cannot combine them:
   *   search   -> /products/search?q=..&limit=..&skip=..
   *   category -> /products/category/{slug}?limit=..&skip=..
   *   neither  -> /products?limit=..&skip=..
   */
  list(query: ListQuery): Observable<ProductsResponse> {
    let params = new HttpParams()
      .set('limit', query.pageSize)
      .set('skip', (query.page - 1) * query.pageSize);

    const search = query.search.trim();
    if (search) {
      params = params.set('q', search);
      return this.http.get<ProductsResponse>(`${this.baseUrl}/search`, { params });
    }
    if (query.category) {
      return this.http.get<ProductsResponse>(
        `${this.baseUrl}/category/${encodeURIComponent(query.category)}`,
        { params },
      );
    }
    return this.http.get<ProductsResponse>(this.baseUrl, { params });
  }

  categories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  /** The server only echoes the fields we sent, so fill the rest with defaults. */
  create(input: ProductInput): Observable<Product> {
    return this.http.post<CreatedProduct>(`${this.baseUrl}/add`, input).pipe(
      map((created): Product => ({ thumbnail: '', images: [], rating: 0, stock: 0, ...created })),
    );
  }

  update(id: number, input: ProductInput): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, input);
  }

  remove(id: number): Observable<DeletedProduct> {
    return this.http.delete<DeletedProduct>(`${this.baseUrl}/${id}`);
  }

  /** GET /http/500 always fails — used to demo the error interceptor. */
  triggerServerError(): Observable<unknown> {
    return this.http.get<unknown>(`${API_URL}/http/500`);
  }
}
