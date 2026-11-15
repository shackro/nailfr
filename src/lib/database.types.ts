type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PayoutState = 'Pending' | 'Approved_Sent';

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        { id: string; email: string | null; is_admin: boolean; created_at: string },
        { id: string; email?: string | null; is_admin?: boolean },
        { email?: string | null; is_admin?: boolean }
      >;
      site_settings: Table<
        { id: number; content: Record<string, unknown>; updated_at: string },
        { id?: number; content: Record<string, unknown> },
        { content?: Record<string, unknown> }
      >;
      salon_services: Table<
        { id: number; name: string; category: string; price: number; duration: number; description: string; is_active: boolean },
        { id?: number; name: string; category: string; price: number; duration: number; description: string; is_active?: boolean },
        { name?: string; category?: string; price?: number; duration?: number; description?: string; is_active?: boolean }
      >;
      bookings: Table<
        { id: number; name: string; phone: string; date: string; time: string; services: string[]; total: number; referral: string | null; status: BookingStatus; created_at: string },
        { name: string; phone: string; date: string; time: string; services: string[]; total: number; referral?: string | null; status?: BookingStatus },
        { name?: string; phone?: string; date?: string; time?: string; services?: string[]; total?: number; referral?: string | null; status?: BookingStatus }
      >;
      reviews: Table<
        { id: number; name: string; rating: number; text: string; service: string | null; status: 'pending' | 'approved' | 'rejected'; created_at: string },
        { name: string; rating: number; text: string; service?: string | null },
        { name?: string; rating?: number; text?: string; service?: string | null; status?: 'pending' | 'approved' | 'rejected' }
      >;
      affiliate_accounts: Table<
        { user_id: string; phone: string; code: string; created_at: string },
        { user_id: string; phone: string; code: string },
        never
      >;
      affiliate_sales_logs: Table<
        { id: number; booking_id: number; affiliate_mpesa_number: string; booking_amount: number; booking_services: string[]; commission_amount: number; payout_state: PayoutState; created_at: string },
        { booking_id: number; affiliate_mpesa_number: string; booking_amount: number; booking_services: string[]; commission_amount: number; payout_state?: PayoutState },
        { payout_state?: PayoutState }
      >;
      portfolio_items: Table<
        { id: number; title: string; category: string; image: string; services: string[]; price: number; is_published: boolean; created_at: string },
        { title: string; category: string; image: string; services: string[]; price: number; is_published?: boolean },
        { title?: string; category?: string; image?: string; services?: string[]; price?: number; is_published?: boolean }
      >;
      events: Table<
        { id: number; title: string; category: string; date: string; time: string; location: string; price: number; total_slots: number; booked_slots: number; image: string; featured: boolean; description: string; instructor: string; is_published: boolean },
        { title: string; category: string; date: string; time: string; location: string; price: number; total_slots: number; booked_slots?: number; image: string; featured?: boolean; description: string; instructor: string; is_published?: boolean },
        { title?: string; category?: string; date?: string; time?: string; location?: string; price?: number; total_slots?: number; booked_slots?: number; image?: string; featured?: boolean; description?: string; instructor?: string; is_published?: boolean }
      >;
      event_registrations: Table<
        { id: number; event_id: number; name: string; phone: string; created_at: string },
        { event_id: number; name: string; phone: string },
        never
      >;
      contact_messages: Table<
        { id: number; name: string; phone: string; email: string; subject: string; message: string; created_at: string },
        { name: string; phone: string; email: string; subject: string; message: string },
        never
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      current_user_phone: { Args: Record<string, never>; Returns: string | null };
      reserve_event: { Args: { p_event_id: number; p_name: string; p_phone: string }; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
