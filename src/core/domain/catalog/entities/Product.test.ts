import { describe, it, expect } from 'vitest';
import { Product } from './Product';
import { ProductVariant } from './ProductVariant';
import { Money } from '../value-objects/Money';
import { Stock } from '../value-objects/Stock';
import { Discount } from '../value-objects/Discount';

import type { ProductStatus } from '@/shared/types/database.types';

describe('Product Entity', () => {
  const createSampleProduct = (stockQuantity = 50, status: ProductStatus = 'ACTIVE') => {
    const regular = Money.create(120000);
    const sale = Money.create(99000);
    const discount = Discount.create(regular, sale);
    const stock = Stock.create(stockQuantity, 10);
    const shippingFee = Money.create(3000);

    return Product.create({
      productCode: 'PROD-0001',
      nameKo: '프리미엄 울 캐시미어 코트',
      discount,
      taxType: 'TAXABLE',
      maxOrderQuantity: 10,
      stock,
      status,
      additionalImages: [],
      shippingFee,
    }).getValue();
  };

  it('상품 엔티티를 정상 생성하고 가격/할인율을 계산한다', () => {
    const product = createSampleProduct();

    expect(product.productCode).toBe('PROD-0001');
    expect(product.nameKo).toBe('프리미엄 울 캐시미어 코트');
    expect(product.regularPrice.amount).toBe(120000);
    expect(product.salePrice.amount).toBe(99000);
    expect(product.discountRate).toBe(18); // ((120000-99000)/120000)*100 = 17.5 -> 18%
    expect(product.status).toBe('ACTIVE');
  });

  it('isOrderable: 재고 및 최대 구매 수량에 따른 주문 가능 여부를 판별한다', () => {
    const product = createSampleProduct(15);

    expect(product.isOrderable(1)).toBe(true);
    expect(product.isOrderable(10)).toBe(true);
    expect(product.isOrderable(11)).toBe(false); // maxOrderQuantity 초과
    expect(product.isOrderable(16)).toBe(false); // 재고 초과
  });

  it('deductStock: 재고가 0이 되면 자동으로 품절(OUT_OF_STOCK)로 변경된다', () => {
    const product = createSampleProduct(10);
    product.deductStock(10);

    expect(product.stock.quantity).toBe(0);
    expect(product.status).toBe('OUT_OF_STOCK');
    expect(product.isOrderable(1)).toBe(false);
  });

  it('restock: 품절 상품에 재고를 입고하면 다시 ACTIVE 상태로 변경된다', () => {
    const product = createSampleProduct(0, 'OUT_OF_STOCK');
    expect(product.status).toBe('OUT_OF_STOCK');

    product.restock(20);
    expect(product.stock.quantity).toBe(20);
    expect(product.status).toBe('ACTIVE');
    expect(product.isOrderable(1)).toBe(true);
  });

  it('addVariant: SKU 옵션을 상품에 추가할 수 있다', () => {
    const product = createSampleProduct();
    const variantResult = ProductVariant.create({
      productId: product.id,
      skuCode: 'PROD-0001-BLK-M',
      variantName: '블랙 / M',
      options: { color: 'Black', size: 'M' },
      additionalPrice: Money.zero(),
      stock: Stock.create(20),
    });

    expect(variantResult.isSuccess).toBe(true);
    product.addVariant(variantResult.getValue());

    expect(product.variants.length).toBe(1);
    expect(product.variants[0].variantName).toBe('블랙 / M');
  });
});
