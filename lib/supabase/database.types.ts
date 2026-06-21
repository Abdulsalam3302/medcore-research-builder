export type AnalyticsEventRow = {
  id?: string;
  created_at?: string;
  event_type: string;
  category: string;
  path?: string | null;
  method?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  ip_hash?: string | null;
  country?: string | null;
  region?: string | null;
  referrer?: string | null;
  user_agent_family?: string | null;
  metadata?: Record<string, unknown>;
  severity?: string;
};

export type Database = {
  public: {
    Tables: {
      analytics_events: {
        Row: AnalyticsEventRow & { id: string; created_at: string };
        Insert: AnalyticsEventRow;
        Update: Partial<AnalyticsEventRow>;
        Relationships: [];
      };
      profiles: {
        Row: { id: string; email: string | null; role: string };
        Insert: { id: string; email?: string | null; role?: string };
        Update: Partial<{ id: string; email: string | null; role: string }>;
        Relationships: [];
      };
      manuscript_projects: {
        Row: { user_id: string; slug: string; title: string | null; state: unknown; updated_at: string };
        Insert: { user_id: string; slug?: string; title?: string | null; state: unknown; updated_at?: string };
        Update: Partial<{ user_id: string; slug: string; title: string | null; state: unknown; updated_at: string }>;
        Relationships: [];
      };
      shared_projects: {
        Row: { token: string; state: unknown; created_at: string; expires_at: string; created_by: string | null };
        Insert: { token: string; state: unknown; expires_at: string; created_by?: string | null };
        Update: Partial<{ token: string; state: unknown; expires_at: string; created_by: string | null }>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          date: string;
          kind: string;
          title: string;
          body: string;
          pinned: boolean;
          cta_label: string | null;
          cta_href: string | null;
        };
        Insert: {
          id: string;
          date?: string;
          kind?: string;
          title: string;
          body: string;
          pinned?: boolean;
          cta_label?: string | null;
          cta_href?: string | null;
        };
        Update: Partial<{
          id: string;
          date: string;
          kind: string;
          title: string;
          body: string;
          pinned: boolean;
          cta_label: string | null;
          cta_href: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
