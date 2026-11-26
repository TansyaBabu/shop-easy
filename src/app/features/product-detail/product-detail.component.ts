import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

type DetailResult =
  | { kind: 'ok'; product: Product }
  | { kind: 'notfound' }
  | { kind: 'error' };

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, DecimalPipe],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly products = inject(ProductService);

  readonly state = signal<'loading' | 'ready' | 'notfound' | 'error'>('loading');
  readonly product = signal<Product | null>(null);
  readonly selectedImage = signal<string | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        tap(() => this.state.set('loading')),
        switchMap((id) => this.load(id)),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (result.kind === 'ok') {
          this.product.set(result.product);
          this.selectedImage.set(result.product.images[0] ?? result.product.thumbnail);
          this.state.set('ready');
        } else {
          this.state.set(result.kind);
        }
      });
  }

  private load(id: number): Observable<DetailResult> {
    if (!Number.isInteger(id) || id < 1) {
      return of<DetailResult>({ kind: 'notfound' }); // e.g. /products/abc
    }
    return this.products.get(id).pipe(
      map((product): DetailResult => ({ kind: 'ok', product })),
      catchError((err: HttpErrorResponse) =>
        of<DetailResult>({ kind: err.status === 404 ? 'notfound' : 'error' }),
      ),
    );
  }
}
