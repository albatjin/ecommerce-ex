import type { ICartRepository } from '../../../domain/cart/repositories/ICartRepository';
import type { CartDTO } from '../dtos/CartDTO';
import { CartDTOMapper } from '../mappers/CartDTOMapper';

export class GetCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  public async execute(cartIdOrUserId: string): Promise<CartDTO> {
    const cart = await this.cartRepository.getCart(cartIdOrUserId);
    return CartDTOMapper.toDTO(cart);
  }
}

