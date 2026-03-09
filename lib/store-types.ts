export type {
  Product as StoreProduct,
  ProductAttribute as StoreProductAttribute,
  ProductCategory as StoreProductCategory,
  ProductImage as StoreProductImage,
  ProductMeta as StoreProductMeta,
} from "@/lib/woocommerce-types";

export type StoreProductPrices = {
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
