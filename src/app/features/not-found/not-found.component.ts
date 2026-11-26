import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Catch-all route for URLs that do not exist. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="state">
      <h1>Page not found</h1>
      <a class="btn" routerLink="/products">Back to products</a>
    </div>
  `,
})
export class NotFoundComponent {}
