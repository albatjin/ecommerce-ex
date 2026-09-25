import { StoreSettings } from '@/core/domain/settings/StoreSettings';
import type { StoreSettingsDTO } from '../dtos/StoreSettingsDTO';
import type { Database } from '@/shared/types/database.types';

type StoreSettingsRow = Database['public']['Tables']['store_settings']['Row'];
type StoreSettingsInsert = Database['public']['Tables']['store_settings']['Insert'];

export class StoreSettingsMapper {
  public static toDTO(entity: StoreSettings): StoreSettingsDTO {
    return {
      id: entity.id,
      storeName: entity.storeName,
      representativeName: entity.representativeName,
      businessNumber: entity.businessNumber,
      ecommercePermitNumber: entity.ecommercePermitNumber,
      csPhone: entity.csPhone,
      csEmail: entity.csEmail,
      address: entity.address,
      zipcode: entity.zipcode,
      logoHeaderUrl: entity.logoHeaderUrl,
      logoMobileUrl: entity.logoMobileUrl,
      faviconUrl: entity.faviconUrl,
      isOperating: entity.isOperating,
      requireAdultVerification: entity.requireAdultVerification,
      allowGuestOrder: entity.allowGuestOrder,
      defaultShippingFee: entity.defaultShippingFee,
      freeShippingThreshold: entity.freeShippingThreshold,
      islandMountainShippingFee: entity.islandMountainShippingFee,
      purchaseRewardRate: entity.purchaseRewardRate,
      textReviewReward: entity.textReviewReward,
      photoReviewReward: entity.photoReviewReward,
      welcomeReward: entity.welcomeReward,
      updatedAt: entity.updatedAt.toISOString(),
      updatedBy: entity.updatedBy,
    };
  }

  public static toDomain(row: StoreSettingsRow): StoreSettings {
    const result = StoreSettings.create(
      {
        storeName: row.store_name,
        representativeName: row.representative_name,
        businessNumber: row.business_number,
        ecommercePermitNumber: row.ecommerce_permit_number,
        csPhone: row.cs_phone,
        csEmail: row.cs_email,
        address: row.address,
        zipcode: row.zipcode,
        logoHeaderUrl: row.logo_header_url,
        logoMobileUrl: row.logo_mobile_url,
        faviconUrl: row.favicon_url,
        isOperating: row.is_operating,
        requireAdultVerification: row.require_adult_verification,
        allowGuestOrder: row.allow_guest_order,
        defaultShippingFee: Number(row.default_shipping_fee),
        freeShippingThreshold: Number(row.free_shipping_threshold),
        islandMountainShippingFee: Number(row.island_mountain_shipping_fee),
        purchaseRewardRate: Number(row.purchase_reward_rate),
        textReviewReward: row.text_review_reward,
        photoReviewReward: row.photo_review_reward,
        welcomeReward: row.welcome_reward,
        updatedAt: new Date(row.updated_at),
        updatedBy: row.updated_by,
      },
      row.id
    );

    if (result.isFailure) {
      return StoreSettings.createDefault();
    }
    return result.getValue();
  }

  public static toPersistence(entity: StoreSettings, updatedBy?: string): StoreSettingsInsert {
    return {
      id: entity.id,
      store_name: entity.storeName,
      representative_name: entity.representativeName,
      business_number: entity.businessNumber,
      ecommerce_permit_number: entity.ecommercePermitNumber,
      cs_phone: entity.csPhone,
      cs_email: entity.csEmail,
      address: entity.address,
      zipcode: entity.zipcode,
      logo_header_url: entity.logoHeaderUrl ?? null,
      logo_mobile_url: entity.logoMobileUrl ?? null,
      favicon_url: entity.faviconUrl ?? null,
      is_operating: entity.isOperating,
      require_adult_verification: entity.requireAdultVerification,
      allow_guest_order: entity.allowGuestOrder,
      default_shipping_fee: entity.defaultShippingFee,
      free_shipping_threshold: entity.freeShippingThreshold,
      island_mountain_shipping_fee: entity.islandMountainShippingFee,
      purchase_reward_rate: entity.purchaseRewardRate,
      text_review_reward: entity.textReviewReward,
      photo_review_reward: entity.photoReviewReward,
      welcome_reward: entity.welcomeReward,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy ?? entity.updatedBy ?? null,
    };
  }
}
