export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  brand?: string;
  thumbnail: string;
  images: string[];
}

/** Response of GET /products, /products/search and /products/category/{slug} */
export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/** One item of GET /products/categories */
export interface Category {
  slug: string;
  name: string;
  url: string;
}

/** What the add / edit form sends (body of POST and PUT). */
export interface ProductInput {
  title: string;
  price: number;
  category: string;
  description: string;
}

/** POST /products/add echoes the input back with a new id. */
export interface CreatedProduct extends ProductInput {
  id: number;
}

/** DELETE /products/{id} returns the product with isDeleted: true. */
export interface DeletedProduct extends Product {
  isDeleted: boolean;
  deletedOn: string;
}

/** The list screen state that decides which endpoint and params to use. */
export interface ListQuery {
  page: number; // 1-based
  pageSize: number;
  search: string;
  category: string; // category slug, '' = all
}
