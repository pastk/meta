import { describe, expect, test } from '@jest/globals';
import { getProducts } from '../src/products';

describe('getProducts', () => {
  test('fr-FR', () => {
    const fr_FR = getProducts('fr-FR');
    expect(fr_FR).toBeDefined();
    if (!fr_FR) return;
    expect(fr_FR.placePagePrompt).toBe(
      "L'application Organic Maps est gratuite pour tout le monde grâce à vos dons. Pas de publicité. Pas de trackers. Open-source.",
    );
    expect(fr_FR.products[fr_FR.products.length - 1].title).toEqual('Autre');
  });
});
