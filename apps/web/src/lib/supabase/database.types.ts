export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PublicationStatus = "published" | "needs_review" | "rejected";
type CatalogOrigin = "seeded" | "scraped" | "manual";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          preferred_currency: string;
          country: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          preferred_currency?: string;
          country?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          preferred_currency?: string;
          country?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_anchor_items: {
        Row: {
          id: string;
          user_id: string;
          client_anchor_id: string;
          style_id: string | null;
          brand_name: string | null;
          style_name: string | null;
          tagged_size: string | null;
          category: "jeans" | "chinos" | "pants";
          active: boolean;
          resolved_spec: Json | null;
          resolution_source:
            "catalog" | "self_reported" | "seeded" | "scraped" | null;
          anchor_notes: Json;
          tight_or_loose_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_anchor_id?: string;
          style_id?: string | null;
          brand_name?: string | null;
          style_name?: string | null;
          tagged_size?: string | null;
          category?: "jeans" | "chinos" | "pants";
          active?: boolean;
          resolved_spec?: Json | null;
          resolution_source?:
            "catalog" | "self_reported" | "seeded" | "scraped" | null;
          anchor_notes?: Json;
          tight_or_loose_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          brand_name?: string | null;
          style_name?: string | null;
          tagged_size?: string | null;
          category?: "jeans" | "chinos" | "pants";
          resolved_spec?: Json | null;
          resolution_source?:
            "catalog" | "self_reported" | "seeded" | "scraped" | null;
          anchor_notes?: Json;
          tight_or_loose_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          positioning: string | null;
          size_chart_confidence:
            "verified" | "ai_normalized" | "unverified" | null;
          status: PublicationStatus;
          origin: CatalogOrigin;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          positioning?: string | null;
          size_chart_confidence?:
            "verified" | "ai_normalized" | "unverified" | null;
          status?: PublicationStatus;
          origin?: CatalogOrigin;
        };
        Update: {
          name?: string;
          positioning?: string | null;
          size_chart_confidence?:
            "verified" | "ai_normalized" | "unverified" | null;
          status?: PublicationStatus;
          origin?: CatalogOrigin;
        };
        Relationships: [];
      };
      size_chart_sources: {
        Row: {
          id: string;
          brand_id: string | null;
          model_name: string | null;
          category: string;
          source_url: string;
          raw_snapshot_path: string | null;
          fetch_method: "seed" | "http" | "manual";
          parse_method: "seed" | "deterministic" | "llm" | "manual";
          confidence: number;
          status: PublicationStatus;
          content_hash: string;
          fetched_at: string;
          origin: CatalogOrigin;
          metadata_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          model_name?: string | null;
          category?: string;
          source_url: string;
          raw_snapshot_path?: string | null;
          fetch_method: "seed" | "http" | "manual";
          parse_method: "seed" | "deterministic" | "llm" | "manual";
          confidence: number;
          status?: PublicationStatus;
          content_hash: string;
          fetched_at: string;
          origin?: CatalogOrigin;
          metadata_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: PublicationStatus;
          confidence?: number;
          raw_snapshot_path?: string | null;
          metadata_json?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      size_charts: {
        Row: {
          id: string;
          brand_id: string | null;
          category_id: string | null;
          raw_source: string | null;
          status: PublicationStatus;
          source_id: string | null;
          origin: CatalogOrigin;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          category_id?: string | null;
          raw_source?: string | null;
          status?: PublicationStatus;
          source_id?: string | null;
          origin?: CatalogOrigin;
          created_at?: string;
        };
        Update: {
          status?: PublicationStatus;
          source_id?: string | null;
          raw_source?: string | null;
          origin?: CatalogOrigin;
        };
        Relationships: [];
      };
      size_chart_entries: {
        Row: {
          id: string;
          size_chart_id: string | null;
          size_label: string;
          canonical_spec: Json;
          origin: CatalogOrigin;
        };
        Insert: {
          id?: string;
          size_chart_id?: string | null;
          size_label: string;
          canonical_spec: Json;
          origin?: CatalogOrigin;
        };
        Update: {
          canonical_spec?: Json;
          origin?: CatalogOrigin;
        };
        Relationships: [];
      };
      garment_reference_catalog: {
        Row: {
          id: string;
          brand_slug: string;
          model_name: string;
          size_label: string;
          category: "jeans" | "chinos" | "pants";
          canonical_spec: Json;
          status: PublicationStatus;
          origin: CatalogOrigin;
          size_chart_source_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_slug: string;
          model_name: string;
          size_label: string;
          category?: "jeans" | "chinos" | "pants";
          canonical_spec: Json;
          status?: PublicationStatus;
          origin?: CatalogOrigin;
          size_chart_source_id?: string | null;
          created_at?: string;
        };
        Update: {
          model_name?: string;
          canonical_spec?: Json;
          status?: PublicationStatus;
          origin?: CatalogOrigin;
          size_chart_source_id?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          brand_id: string | null;
          merchant_id: string | null;
          title: string;
          description: string | null;
          category: string | null;
          subcategory: string | null;
          price_cents: number;
          currency: string;
          hero_image_url: string | null;
          status: PublicationStatus;
          origin: CatalogOrigin;
          size_chart_source_id: string | null;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          merchant_id?: string | null;
          title: string;
          description?: string | null;
          category?: string | null;
          subcategory?: string | null;
          price_cents: number;
          currency?: string;
          hero_image_url?: string | null;
          status?: PublicationStatus;
          origin?: CatalogOrigin;
          size_chart_source_id?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          price_cents?: number;
          hero_image_url?: string | null;
          status?: PublicationStatus;
          origin?: CatalogOrigin;
          size_chart_source_id?: string | null;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string | null;
          size_label: string;
          sku: string | null;
          stock: number;
          price_cents: number | null;
          in_stock: boolean;
          garment_spec: Json | null;
          origin: CatalogOrigin;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          size_label: string;
          sku?: string | null;
          stock?: number;
          price_cents?: number | null;
          in_stock?: boolean;
          garment_spec?: Json | null;
          origin?: CatalogOrigin;
        };
        Update: {
          stock?: number;
          price_cents?: number | null;
          in_stock?: boolean;
          garment_spec?: Json | null;
          origin?: CatalogOrigin;
        };
        Relationships: [];
      };
      styles: {
        Row: {
          id: string;
          brand_id: string | null;
          slug: string;
          style_name: string;
          category: string;
          confidence: "high" | "medium" | "low";
          source_url: string | null;
          active: boolean;
          status: PublicationStatus;
          origin: CatalogOrigin;
          size_chart_source_id: string | null;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          slug: string;
          style_name: string;
          category: string;
          confidence?: "high" | "medium" | "low";
          source_url?: string | null;
          active?: boolean;
          status?: PublicationStatus;
          origin?: CatalogOrigin;
          size_chart_source_id?: string | null;
        };
        Update: {
          style_name?: string;
          confidence?: "high" | "medium" | "low";
          source_url?: string | null;
          active?: boolean;
          status?: PublicationStatus;
          origin?: CatalogOrigin;
          size_chart_source_id?: string | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          type: string;
          payload: Json;
          status:
            "pending" | "processing" | "completed" | "failed" | "cancelled";
          attempts: number;
          max_attempts: number;
          run_after: string;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          payload?: Json;
          status?:
            "pending" | "processing" | "completed" | "failed" | "cancelled";
          attempts?: number;
          max_attempts?: number;
          run_after?: string;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?:
            "pending" | "processing" | "completed" | "failed" | "cancelled";
          attempts?: number;
          run_after?: string;
          last_error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      merge_guest_anchors: {
        Args: { p_anchors: Json };
        Returns: string[];
      };
      set_active_anchor: {
        Args: { p_anchor_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
