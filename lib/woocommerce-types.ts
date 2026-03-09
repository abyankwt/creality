export interface ProductImage {
  id: number;
  src: string;
  thumbnail?: string | null;
  alt?: string | null;
  name?: string | null;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description?: string;
  image?: ProductImage | null;
}

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  variation: boolean;
  visible: boolean;
  options: string[];
  terms?: Array<{ id?: number; name?: string; slug?: string }>;
}

export type ProductPrices = {
  price?: string;
  regular_price?: string;
  sale_price?: string;
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
};

export type ProductMeta = {
  id?: number;
  key: string;
  value: string;
};

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  description?: string;
  short_description?: string;
  price_html?: string;
  prices?: ProductPrices;
  price: number;
  regular_price: number;
  sale_price: number;
  formatted_price: string;
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  images: ProductImage[];
  attributes: ProductAttribute[];
  categories: ProductCategory[];
  tags: ProductTag[];
  meta_data?: ProductMeta[];
  stock_status: string;
  stock_quantity?: number | null;
  purchasable: boolean;
  average_rating?: number;
  review_count?: number;
  featured?: boolean;
  related_ids?: number[];
}
