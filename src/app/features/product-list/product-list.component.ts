import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  merge,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { PAGE_SIZE } from '../../core/config';
import {
  Category,
  ListQuery,
  Product,
  ProductsResponse,
} from '../../core/models/product.model';
import { NotificationService } from '../../core/services/notification.service';
import { ProductService } from '../../core/services/product.service';
import { ProductFormComponent } from '../product-form/product-form.component';

type LoadResult = { ok: true; data: ProductsResponse } | { ok: false };

@Component({
  selector: 'app-product-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DecimalPipe, ProductFormComponent],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly notify = inject(NotificationService);

  // --- screen state (all signals) ---
  readonly state = signal<'loading' | 'error' | 'ready'>('loading');
  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly category = signal('');
  readonly categories = signal<Category[]>([]);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  // --- add / edit / delete state ---
  readonly formOpen = signal(false);
  readonly editing = signal<Product | null>(null);
  readonly pendingDelete = signal<Product | null>(null);
  readonly deleting = signal(false);

  readonly searchCtrl = new FormControl('', { nonNullable: true });

  private readonly retry$ = new Subject<void>();

  constructor() {
    // Categories for the dropdown. If this fails the list still works.
    this.productService
      .categories()
      .pipe(
        catchError(() => of<Category[]>([])),
        takeUntilDestroyed(),
      )
      .subscribe((categories) => this.categories.set(categories));

    // 1) Typing: wait 400 ms, then put the text in the URL (and go back to page 1).
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(400),
        map((text) => text.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((text) => this.updateUrl({ q: text || null, category: null, page: null }));

    // 2) The URL is the single source of truth. Every change of page / q / category
    //    (or a Retry click) loads the list. switchMap cancels the previous request,
    //    so a slow old response can never overwrite a newer one.
    const params$ = merge(
      this.route.queryParamMap,
      this.retry$.pipe(map(() => this.route.snapshot.queryParamMap)),
    );

    params$
      .pipe(
        map((params) => this.toQuery(params)),
        tap((query) => {
          this.page.set(query.page);
          this.category.set(query.category);
          if (this.searchCtrl.value.trim() !== query.search) {
            this.searchCtrl.setValue(query.search, { emitEvent: false });
          }
          this.state.set('loading');
        }),
        switchMap((query) =>
          this.productService.list(query).pipe(
            map((data): LoadResult => ({ ok: true, data })),
            catchError(() => of<LoadResult>({ ok: false })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (result.ok) {
          this.products.set(result.data.products);
          this.total.set(result.data.total);
          this.state.set('ready');
        } else {
          this.state.set('error');
        }
      });
  }

  // --- paging / filtering (they only change the URL) ---
  previous(): void {
    this.updateUrl({ page: this.page() - 1 <= 1 ? null : this.page() - 1 });
  }

  next(): void {
    this.updateUrl({ page: this.page() + 1 });
  }

  onCategory(event: Event): void {
    const slug = (event.target as HTMLSelectElement).value;
    this.updateUrl({ category: slug || null, q: null, page: null });
  }

  retry(): void {
    this.retry$.next();
  }

  // --- add / edit ---
  openAdd(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  openEdit(product: Product): void {
    this.editing.set(product);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  /** The API does not really save, so we update the list from the response ourselves. */
  onSaved(saved: Product): void {
    if (this.editing()) {
      this.products.update((list) => list.map((p) => (p.id === saved.id ? saved : p)));
      this.notify.success('Product updated');
    } else {
      this.products.update((list) => [saved, ...list]);
      this.total.update((n) => n + 1);
      this.notify.success('Product added');
    }
    this.closeForm();
  }

  // --- delete (with confirmation) ---
  askDelete(product: Product): void {
    this.pendingDelete.set(product);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const product = this.pendingDelete();
    if (!product) {
      return;
    }
    this.deleting.set(true);
    this.productService
      .remove(product.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.products.update((list) => list.filter((p) => p.id !== product.id));
          this.total.update((n) => Math.max(0, n - 1));
          this.pendingDelete.set(null);
          this.notify.success('Product deleted');
        },
        error: () => {
          this.pendingDelete.set(null);
          this.notify.error('Could not delete the product');
        },
      });
  }

  // --- helpers ---
  private toQuery(params: ParamMap): ListQuery {
    const page = Number(params.get('page'));
    return {
      page: Number.isInteger(page) && page >= 1 ? page : 1,
      pageSize: PAGE_SIZE,
      search: (params.get('q') ?? '').trim(),
      category: params.get('category') ?? '',
    };
  }

  /** null removes a param from the URL; the rest are kept (queryParamsHandling: merge). */
  private updateUrl(changes: { page?: number | null; q?: string | null; category?: string | null }): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
    });
  }
}
