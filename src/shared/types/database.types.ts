export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'customer';
export type MembershipGrade = 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP' | 'VVIP';
export type UserStatus = 'ACTIVE' | 'DORMANT_WARNING' | 'DORMANT' | 'WITHDRAWN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type ProductTaxType = 'TAXABLE' | 'TAX_EXEMPT';
export type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN' | 'DRAFT';
export type VariantStatus = 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'NAVER_PAY'
  | 'KAKAO_PAY'
  | 'TOSS_PAY'
  | 'VIRTUAL_ACCOUNT'
  | 'MOBILE';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type OrderItemStatus =
  | 'ORDERED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'RETURNED';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          customer_number: string | null;
          email: string;
          name: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          membership_grade: MembershipGrade;
          status: UserStatus;
          total_spent: number;
          total_orders: number;
          reward_points: number;
          coupons_count: number;
          personal_customs_code: string | null;
          gender: Gender | null;
          birth_year: number | null;
          sms_consent: boolean;
          email_consent: boolean;
          app_push_consent: boolean;
          default_address: string | null;
          default_zipcode: string | null;
          last_visit_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          customer_number?: string | null;
          email: string;
          name: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          membership_grade?: MembershipGrade;
          status?: UserStatus;
          total_spent?: number;
          total_orders?: number;
          reward_points?: number;
          coupons_count?: number;
          personal_customs_code?: string | null;
          gender?: Gender | null;
          birth_year?: number | null;
          sms_consent?: boolean;
          email_consent?: boolean;
          app_push_consent?: boolean;
          default_address?: string | null;
          default_zipcode?: string | null;
          last_visit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_number?: string | null;
          email?: string;
          name?: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          membership_grade?: MembershipGrade;
          status?: UserStatus;
          total_spent?: number;
          total_orders?: number;
          reward_points?: number;
          coupons_count?: number;
          personal_customs_code?: string | null;
          gender?: Gender | null;
          birth_year?: number | null;
          sms_consent?: boolean;
          email_consent?: boolean;
          app_push_consent?: boolean;
          default_address?: string | null;
          default_zipcode?: string | null;
          last_visit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          depth: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          depth?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          depth?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          product_code: string;
          name_ko: string;
          name_en: string | null;
          category_id: string | null;
          regular_price: number;
          sale_price: number;
          discount_rate: number;
          tax_type: ProductTaxType;
          max_order_quantity: number;
          stock_quantity: number;
          safety_stock: number;
          status: ProductStatus;
          sku_code: string | null;
          manufacturer: string | null;
          brand_name: string | null;
          description: string | null;
          cover_image_url: string | null;
          additional_images: Json;
          shipping_fee: number;
          origin_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_code: string;
          name_ko: string;
          name_en?: string | null;
          category_id?: string | null;
          regular_price: number;
          sale_price: number;
          discount_rate?: number;
          tax_type?: ProductTaxType;
          max_order_quantity?: number;
          stock_quantity?: number;
          safety_stock?: number;
          status?: ProductStatus;
          sku_code?: string | null;
          manufacturer?: string | null;
          brand_name?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          additional_images?: Json;
          shipping_fee?: number;
          origin_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_code?: string;
          name_ko?: string;
          name_en?: string | null;
          category_id?: string | null;
          regular_price?: number;
          sale_price?: number;
          discount_rate?: number;
          tax_type?: ProductTaxType;
          max_order_quantity?: number;
          stock_quantity?: number;
          safety_stock?: number;
          status?: ProductStatus;
          sku_code?: string | null;
          manufacturer?: string | null;
          brand_name?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          additional_images?: Json;
          shipping_fee?: number;
          origin_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku_code: string;
          variant_name: string;
          options: Json;
          additional_price: number;
          stock_quantity: number;
          status: VariantStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku_code: string;
          variant_name: string;
          options?: Json;
          additional_price?: number;
          stock_quantity?: number;
          status?: VariantStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku_code?: string;
          variant_name?: string;
          options?: Json;
          additional_price?: number;
          stock_quantity?: number;
          status?: VariantStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          order_name: string;
          status: OrderStatus;
          total_product_amount: number;
          discount_amount: number;
          point_used: number;
          shipping_fee: number;
          total_paid_amount: number;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          payment_details: Json;
          recipient_name: string;
          recipient_phone: string;
          shipping_address: string;
          shipping_zipcode: string;
          shipping_message: string | null;
          tracking_company: string | null;
          tracking_number: string | null;
          paid_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id?: string | null;
          order_name: string;
          status?: OrderStatus;
          total_product_amount?: number;
          discount_amount?: number;
          point_used?: number;
          shipping_fee?: number;
          total_paid_amount?: number;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          payment_details?: Json;
          recipient_name: string;
          recipient_phone: string;
          shipping_address: string;
          shipping_zipcode: string;
          shipping_message?: string | null;
          tracking_company?: string | null;
          tracking_number?: string | null;
          paid_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          order_name?: string;
          status?: OrderStatus;
          total_product_amount?: number;
          discount_amount?: number;
          point_used?: number;
          shipping_fee?: number;
          total_paid_amount?: number;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          payment_details?: Json;
          recipient_name?: string;
          recipient_phone?: string;
          shipping_address?: string;
          shipping_zipcode?: string;
          shipping_message?: string | null;
          tracking_company?: string | null;
          tracking_number?: string | null;
          paid_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          variant_name: string | null;
          product_image_url: string | null;
          sku_code: string | null;
          unit_price: number;
          quantity: number;
          discount_amount: number;
          total_price: number;
          status: OrderItemStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          variant_name?: string | null;
          product_image_url?: string | null;
          sku_code?: string | null;
          unit_price: number;
          quantity?: number;
          discount_amount?: number;
          total_price: number;
          status?: OrderItemStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name?: string;
          variant_name?: string | null;
          product_image_url?: string | null;
          sku_code?: string | null;
          unit_price?: number;
          quantity?: number;
          discount_amount?: number;
          total_price?: number;
          status?: OrderItemStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          }
        ];
      };
      order_notes: {
        Row: {
          id: string;
          order_id: string;
          author_id: string | null;
          author_name: string;
          content: string;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          author_id?: string | null;
          author_name: string;
          content: string;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          author_id?: string | null;
          author_name?: string;
          content?: string;
          is_system?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_notes_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      customer_notes: {
        Row: {
          id: string;
          customer_id: string;
          author_id: string | null;
          author_name: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          author_id?: string | null;
          author_name: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          author_id?: string | null;
          author_name?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_notes_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      customer_coupons: {
        Row: {
          id: string;
          customer_id: string;
          name: string;
          discount_amount: number | null;
          discount_rate: number | null;
          min_order_amount: number;
          is_used: boolean;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          name: string;
          discount_amount?: number | null;
          discount_rate?: number | null;
          min_order_amount?: number;
          is_used?: boolean;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          name?: string;
          discount_amount?: number | null;
          discount_rate?: number | null;
          min_order_amount?: number;
          is_used?: boolean;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_coupons_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      point_transactions: {
        Row: {
          id: string;
          customer_id: string;
          order_id: string | null;
          amount: number;
          balance_after: number;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          order_id?: string | null;
          amount: number;
          balance_after: number;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          order_id?: string | null;
          amount?: number;
          balance_after?: number;
          description?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'point_transactions_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      store_settings: {
        Row: {
          id: string;
          store_name: string;
          representative_name: string;
          business_number: string;
          ecommerce_permit_number: string;
          cs_phone: string;
          cs_email: string;
          address: string;
          zipcode: string;
          logo_header_url: string | null;
          logo_mobile_url: string | null;
          favicon_url: string | null;
          is_operating: boolean;
          require_adult_verification: boolean;
          allow_guest_order: boolean;
          default_shipping_fee: number;
          free_shipping_threshold: number;
          island_mountain_shipping_fee: number;
          purchase_reward_rate: number;
          text_review_reward: number;
          photo_review_reward: number;
          welcome_reward: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          store_name?: string;
          representative_name?: string;
          business_number?: string;
          ecommerce_permit_number?: string;
          cs_phone?: string;
          cs_email?: string;
          address?: string;
          zipcode?: string;
          logo_header_url?: string | null;
          logo_mobile_url?: string | null;
          favicon_url?: string | null;
          is_operating?: boolean;
          require_adult_verification?: boolean;
          allow_guest_order?: boolean;
          default_shipping_fee?: number;
          free_shipping_threshold?: number;
          island_mountain_shipping_fee?: number;
          purchase_reward_rate?: number;
          text_review_reward?: number;
          photo_review_reward?: number;
          welcome_reward?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          store_name?: string;
          representative_name?: string;
          business_number?: string;
          ecommerce_permit_number?: string;
          cs_phone?: string;
          cs_email?: string;
          address?: string;
          zipcode?: string;
          logo_header_url?: string | null;
          logo_mobile_url?: string | null;
          favicon_url?: string | null;
          is_operating?: boolean;
          require_adult_verification?: boolean;
          allow_guest_order?: boolean;
          default_shipping_fee?: number;
          free_shipping_threshold?: number;
          island_mountain_shipping_fee?: number;
          purchase_reward_rate?: number;
          text_review_reward?: number;
          photo_review_reward?: number;
          welcome_reward?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_dashboard_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          today_sales: number;
          sales_diff_rate: number;
          today_orders: number;
          orders_diff: number;
          today_customers: number;
          customers_diff: number;
          low_stock_products: number;
        };
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      membership_grade: MembershipGrade;
      user_status: UserStatus;
      gender: Gender;
      product_tax_type: ProductTaxType;
      product_status: ProductStatus;
      variant_status: VariantStatus;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      order_item_status: OrderItemStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

