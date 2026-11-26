import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { Category, Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

/**
 * One form for both add and edit.
 *  - `product` set   -> edit (PUT)
 *  - `product` null  -> add (POST)
 * It emits the saved product; the parent updates its list from it.
 */
@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  private readonly products = inject(ProductService);

  readonly product = input<Product | null>(null);
  readonly categories = input<Category[]>([]);

  readonly saved = output<Product>();
  readonly cancelled = output<void>();

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)], // no blank-only titles
    }),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    category: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  });

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const existing = this.product();
    if (existing) {
      this.form.patchValue({
        title: existing.title,
        price: existing.price,
        category: existing.category,
        description: existing.description,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.price === null) {
      return; // cannot happen once the form is valid; keeps the type narrow
    }
    const input = {
      title: value.title.trim(),
      price: value.price,
      category: value.category,
      description: value.description.trim(),
    };

    const existing = this.product();
    const request$ = existing
      ? this.products.update(existing.id, input)
      : this.products.create(input);

    this.saving.set(true);
    this.error.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      // Merge so fields the server did not echo back (thumbnail, rating…) are kept.
      next: (result) => this.saved.emit(existing ? { ...existing, ...result } : result),
      error: () => this.error.set('Could not save the product. Please try again.'),
    });
  }
}
