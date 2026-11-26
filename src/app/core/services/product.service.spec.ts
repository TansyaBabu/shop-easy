import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../config';
import { ListQuery } from '../models/product.model';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  const base: ListQuery = { page: 1, pageSize: 10, search: '', category: '' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify()); // fails the test if a request was not expected

  it('lists page 3 with limit and skip', () => {
    service.list({ ...base, page: 3 }).subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/products`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('skip')).toBe('20');
    req.flush({ products: [], total: 0, skip: 20, limit: 10 });
  });

  it('uses /products/search when there is a search text', () => {
    service.list({ ...base, search: ' phone ' }).subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/products/search`);
    expect(req.request.params.get('q')).toBe('phone');
    req.flush({ products: [], total: 0, skip: 0, limit: 10 });
  });

  it('uses /products/category/{slug} for a category', () => {
    service.list({ ...base, category: 'laptops' }).subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/products/category/laptops`);
    expect(req.request.method).toBe('GET');
    req.flush({ products: [], total: 0, skip: 0, limit: 10 });
  });

  it('POSTs a new product to /products/add and fills defaults', () => {
    let result: unknown;
    service
      .create({ title: 'Pen', price: 2, category: 'stationery', description: '' })
      .subscribe((p) => (result = p));
    const req = http.expectOne(`${API_URL}/products/add`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 195, title: 'Pen', price: 2, category: 'stationery', description: '' });
    expect(result).toMatchObject({ id: 195, title: 'Pen', thumbnail: '', rating: 0 });
  });

  it('PUTs an update and DELETEs a product', () => {
    service.update(5, { title: 'X', price: 1, category: 'c', description: '' }).subscribe();
    const put = http.expectOne(`${API_URL}/products/5`);
    expect(put.request.method).toBe('PUT');
    put.flush({});

    service.remove(5).subscribe();
    const del = http.expectOne(`${API_URL}/products/5`);
    expect(del.request.method).toBe('DELETE');
    del.flush({});
  });
});
