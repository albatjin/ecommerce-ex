import type { ICartRepository } from '../../../domain/cart/repositories/ICartRepository';
import type { ToggleCartItemInput, CartDTO } from '../dtos/CartDTO';
import { CartDTOMapper } from '../mappers/CartDTOMapper';

export class ToggleCartItemUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  public async execute(input: ToggleCartItemInput): Promise<CartDTO> {
    const cart = await this.cartRepository.getCart(input.cartIdOrUserId);

    if (input.selectAll !== undefined) {
      cart.selectAll(input.selectAll);
    } else if (input.itemId) {
      if (input.selected !== undefined) {
        const item = cart.items.find((i) => i.id === input.itemId);
        if (item) item.setSelected(input.selected);
      } else {
        cart.toggleItemSelect(input.itemId);
      }
    }

    await this.cartRepository.saveCart(cart);
    return CartDTOMapper.toDTO(cart);
  }
}

