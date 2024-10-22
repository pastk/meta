import LOCALES from './locales';
import PRODUCTS_JSON from './products.json';

export interface Product {
  title: string;
  link: string;
}

const PRODUCTS = PRODUCTS_JSON as Record<string, Product[]>;

export interface ProductsConfig {
  placePagePrompt: string;
  products: Product[];
}

export function getProducts(locale: string | null): ProductsConfig | undefined {
  if (!locale) {
    return undefined;
  }
  const parts = locale.split(/[-_]/);
  const language = parts[0].toLowerCase();
  const country = parts[1] ? parts[1].toUpperCase() : '';

  const products = PRODUCTS[country];
  const trans = LOCALES[language];
  if (products === undefined || trans === undefined) {
    return undefined;
  }

  return {
    placePagePrompt: trans.placePagePrompt,
    products: products.map((product) => ({
      ...product,
      title: product.title
        .replace('$other', trans.otherAmount)
        .replace('$per_month', trans.perMonth)
        .replace('$per_year', trans.perYear),
    })),
  };
}
