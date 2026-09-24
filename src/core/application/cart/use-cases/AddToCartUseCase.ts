import type { ICartRepository } from '../../../domain/cart/repositories/ICartRepository';
import { CartItem } from '../../../domain/cart/entities/CartItem';
import { Money } from '../../../domain/catalog/value-objects/Money';
import { Result, ok, fail } from '../../../domain/shared/Result';
import { DomainError } from '../../../domain/shared/AppError';
import type { AddToCartInput, CartDTO } from '../dtos/CartDTO';
import { CartDTOMapper } from '../mappers/CartDTOMapper';

export class AddToCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  public async execute(input: AddToCartInput): Promise<Result<CartDTO, DomainError>> {
    const itemResult = CartItem.create({
      productId: input.productId,
      variantId: input.variantId ?? null,
      productName: input.productName,
      variantName: input.variantName ?? null,
      price: Money.create(input.price),
      quantity: input.quantity,
      coverImageUrl: input.coverImageUrl ?? null,
      shippingFee: Money.create(input.shippingFee ?? 3000),
    });

    if (itemResult.isFailure) {
      return fail(itemResult.getError());
    }

    const cart = await this.cartRepository.getCart(input.cartIdOrUserId);
    cart.addItem(itemResult.getValue());
    await this.cartRepository.saveCart(cart);

    return ok(CartDTOMapper.toDTO(cart));
  }
}

