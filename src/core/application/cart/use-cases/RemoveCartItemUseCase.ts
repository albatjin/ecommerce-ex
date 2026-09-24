import type { ICartRepository } from '../../../domain/cart/repositories/ICartRepository';
import type { RemoveCartItemInput, CartDTO } from '../dtos/CartDTO';
import { CartDTOMapper } from '../mappers/CartDTOMapper';

export class RemoveCartItemUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  public async execute(input: RemoveCartItemInput): Promise<CartDTO> {
    const cart = await this.cartRepository.getCart(input.cartIdOrUserId);

    if (input.selectedOnly) {
      cart.removeSelectedItems();
    } else if (input.itemId) {
      cart.removeItem(input.itemId);
    } else {
      cart.clear();
    }

    await this.cartRepository.saveCart(cart);
    return CartDTOMapper.toDTO(cart);
  }
}

