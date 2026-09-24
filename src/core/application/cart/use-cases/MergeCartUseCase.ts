import type { ICartRepository } from '../../../domain/cart/repositories/ICartRepository';
import type { MergeCartInput, CartDTO } from '../dtos/CartDTO';
import { CartDTOMapper } from '../mappers/CartDTOMapper';

export class MergeCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  public async execute(input: MergeCartInput): Promise<CartDTO> {
    const [guestCart, userCart] = await Promise.all([
      this.cartRepository.getCart(input.guestCartId),
      this.cartRepository.getCart(input.userCartId),
    ]);

    userCart.merge(guestCart);

    await Promise.all([
      this.cartRepository.saveCart(userCart),
      this.cartRepository.clearCart(input.guestCartId),
    ]);

    return CartDTOMapper.toDTO(userCart);
  }
}

