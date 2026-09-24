import type { ICartRepository } from '../../../domain/cart/repositories/ICartRepository';
import { Result, ok, fail } from '../../../domain/shared/Result';
import { DomainError } from '../../../domain/shared/AppError';
import type { UpdateCartItemQuantityInput, CartDTO } from '../dtos/CartDTO';
import { CartDTOMapper } from '../mappers/CartDTOMapper';

export class UpdateCartItemQuantityUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  public async execute(
    input: UpdateCartItemQuantityInput
  ): Promise<Result<CartDTO, DomainError>> {
    const cart = await this.cartRepository.getCart(input.cartIdOrUserId);
    const updateResult = cart.updateItemQuantity(input.itemId, input.quantity);

    if (updateResult.isFailure) {
      return fail(updateResult.getError());
    }

    await this.cartRepository.saveCart(cart);
    return ok(CartDTOMapper.toDTO(cart));
  }
}
