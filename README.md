# 🛒 ShopEasy — Product Catalog

Angular 21 app (standalone components, `inject()`, signals, `@if` / `@for`) that logs in to
[DummyJSON](https://dummyjson.com), lists products with paging, search and category filter, shows a
product, and adds / edits / deletes products.

## How to run

```bash
npm install
npm start          # http://localhost:4200
npm test           # unit tests (ProductService + app shell)
```

**Test login:** `emilys` / `emilyspass`

## What is finished

| | Item | Where |
|---|---|---|
| ✅ R1 | Login: reactive form, both fields required, button disabled while the request runs, token in `localStorage`, `400` → "Invalid username or password" under the form, header shows the user's name (`GET /auth/me`) and Logout | `features/login`, `core/services/auth.service.ts`, `app.html` |
| ✅ R2 | Product list: thumbnail, title, price, rating; Previous / Next with "Page X of Y"; debounced search (400 ms); category dropdown; loading / error (with Retry) / empty / data states | `features/product-list` |
| ✅ R3 | Product detail `/products/:id` with images, description, price, stock, brand, category; unknown id → "Product not found" page with back link | `features/product-detail` |
| ✅ R4 | One form for add and edit (title required, price required and > 0, category required, description); delete asks first; the list is updated from the response and a success message is shown | `features/product-form`, `features/product-list` |
| ✅ R5 | All HTTP in `AuthService` and `ProductService`; interfaces for every request and response; no `any`; base URL only in `core/config.ts` | `core/` |
| ✅ R6 | Auth interceptor (`req.clone` + Bearer header); error interceptor (401 → clear token + login, 0 / 5xx → "Server problem, try again") | `core/interceptors` |
| ✅ Bonus | Route guard · `switchMap` for search/list · global loading bar (interceptor) · page / search / category kept in the URL · `ProductService` unit tests with `HttpTestingController` | `core/guards`, `product-list`, `core/interceptors/loading.interceptor.ts`, `product.service.spec.ts` |

## Request map (what to show in the Network tab)

| Action | Request |
|---|---|
| Log in | `POST /auth/login` body `{username, password}` → `accessToken` (wrong password → 400) |
| Header name | `GET /auth/me` + `Authorization: Bearer …` |
| List page 3 | `GET /products?limit=10&skip=20` |
| Search | `GET /products/search?limit=10&skip=0&q=phone` (one request ~400 ms after the last key) |
| Category | `GET /products/category/{slug}?limit=10&skip=0` |
| Dropdown | `GET /products/categories` |
| Detail | `GET /products/{id}` (unknown id → 404) |
| Add / edit / delete | `POST /products/add` · `PUT /products/{id}` · `DELETE /products/{id}` |
| 500 demo | **Test 500** button in the header → `GET /http/500` |

## How it fits together

* **Components** never touch `HttpClient`; they call services and keep their state in signals.
* **Interceptors** run in this order: `loading → auth → error`. A request goes down through them and
  the response comes back up.
* **The URL is the source of truth for the list.** Paging, search and category only change the query
  params (`?page=2&q=phone&category=laptops`). One `queryParamMap` stream with `switchMap` loads the
  data, so a slow old response is cancelled and a refresh keeps the state.
* **Fake writes:** DummyJSON does not save anything, so after POST / PUT / DELETE the list is updated
  from the response (add → put at the top, edit → replace, delete → remove) and `total` is adjusted.

## What I did not do / known limits

* **Search and category cannot be combined** — DummyJSON has no endpoint for both. Search wins;
  picking a category clears the search box and typing a search clears the category.
* **A product added in this session is not really on the server**, so *editing or deleting it* returns
  404 and shows an error. Edit/delete on products that came from the API work.
* Reloading after a write brings back the original data (by design of the API).
* No e2e tests; unit tests cover `ProductService` only.

## What I would do differently with more time

* A shared HTTP-error-to-message helper and `returnUrl` after login.
* Refresh-token handling (`/auth/refresh`) instead of just logging out on 401.
* Component tests for the list states.

## Notes on AI use

AI assistance was used while writing this project, as the brief allows. Every file is meant to be
explainable line by line — see "How it fits together" above and the self-check below.

## Self-check (from the brief)

- [ ] Wrong password shows a message; right password logs in and shows my name.
- [ ] Every request in the Network tab has the `Authorization` header after login.
- [ ] Deleting the token in DevTools and reloading sends me back to login (guard).
- [ ] Typing in search fires one request after I stop typing, not one per key.
- [ ] Paging shows the right page numbers and stops at the first / last page.
- [ ] `/products/99999` shows "Product not found".
- [ ] **Test 500** shows my global error message.
- [ ] Add / edit / delete update the list on screen.
- [ ] No `any`, no `HttpClient` in components, no red errors in the console.
- [ ] README is written and everything is pushed.
