export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Hand-maintained mirror of the authoritative schema:
 *   supabase/migrations/20260828000000_phase3_schema.sql
 *   supabase/migrations/20260829000000_lesson_content_gating.sql
 *   supabase/migrations/20260930000000_certificate_registry.sql
 *   supabase/migrations/20261001000000_lesson_progress.sql
 *   supabase/migrations/20261002000000_certificate_storage_path.sql
 *   supabase/migrations/20261007100000_enforce_single_role_per_user.sql
 *   supabase/migrations/20261007110000_course_documents_and_live_sessions.sql
 *   supabase/migrations/20261007120000_admin_course_lesson_writes.sql
 *   supabase/migrations/20261007130000_payment_requests.sql
 *
 * Tables that exist only in earlier revisions (enrollments, categories) and
 * columns dropped by later migrations (lessons.content_markdown) have been
 * removed. `Relationships` mirrors the foreign keys declared in the
 * migrations so embedded resource selects type-resolve.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          company_name: string | null
          location: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          company_name?: string | null
          location?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          company_name?: string | null
          location?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          assigned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          id: string
          slug: string
          title: string
          short_description: string
          full_description: string
          icon_name: string | null
          deliverables: Json
          target_audience: string | null
          is_active: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          short_description: string
          full_description: string
          icon_name?: string | null
          deliverables?: Json
          target_audience?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          short_description?: string
          full_description?: string
          icon_name?: string | null
          deliverables?: Json
          target_audience?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      consultation_requests: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          email: string
          phone: string
          company_name: string | null
          service_interest: string
          project_scope: string
          budget_range: string
          timeline: string
          status: 'pending' | 'contacted' | 'in_progress' | 'closed'
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          email: string
          phone: string
          company_name?: string | null
          service_interest: string
          project_scope: string
          budget_range: string
          timeline: string
          status?: 'pending' | 'contacted' | 'in_progress' | 'closed'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          email?: string
          phone?: string
          company_name?: string | null
          service_interest?: string
          project_scope?: string
          budget_range?: string
          timeline?: string
          status?: 'pending' | 'contacted' | 'in_progress' | 'closed'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_inquiries: {
        Row: {
          id: string
          service_id: string | null
          full_name: string
          email: string
          phone: string
          company_name: string | null
          message: string
          status: 'new' | 'reviewed' | 'converted' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          service_id?: string | null
          full_name: string
          email: string
          phone: string
          company_name?: string | null
          message: string
          status?: 'new' | 'reviewed' | 'converted' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          service_id?: string | null
          full_name?: string
          email?: string
          phone?: string
          company_name?: string | null
          message?: string
          status?: 'new' | 'reviewed' | 'converted' | 'archived'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_inquiries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          id: string
          name: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          slug: string
          title: string
          category: string
          level: string
          price_ngn: number
          duration: string
          short_description: string
          overview: string
          learning_outcomes: Json
          prerequisites: string | null
          is_popular: boolean
          is_published: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          category: string
          level?: string
          price_ngn?: number
          duration: string
          short_description: string
          overview: string
          learning_outcomes?: Json
          prerequisites?: string | null
          is_popular?: boolean
          is_published?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          category?: string
          level?: string
          price_ngn?: number
          duration?: string
          short_description?: string
          overview?: string
          learning_outcomes?: Json
          prerequisites?: string | null
          is_popular?: boolean
          is_published?: boolean
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          content_type: 'video' | 'text' | 'document'
          duration_minutes: number
          order_index: number
          is_preview: boolean
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          content_type?: 'video' | 'text' | 'document'
          duration_minutes?: number
          order_index?: number
          is_preview?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          content_type?: 'video' | 'text' | 'document'
          duration_minutes?: number
          order_index?: number
          is_preview?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_content: {
        Row: {
          lesson_id: string
          content_url: string | null
          content_body: string | null
        }
        Insert: {
          lesson_id: string
          content_url?: string | null
          content_body?: string | null
        }
        Update: {
          lesson_id?: string
          content_url?: string | null
          content_body?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_content_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          id: string
          course_id: string
          title: string
          scheduled_at: string
          join_url: string
          recording_lesson_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          scheduled_at: string
          join_url: string
          recording_lesson_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          scheduled_at?: string
          join_url?: string
          recording_lesson_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_recording_lesson_id_fkey"
            columns: ["recording_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: 'active' | 'completed' | 'dropped'
          progress_percent: number
          enrolled_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: 'active' | 'completed' | 'dropped'
          progress_percent?: number
          enrolled_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: 'active' | 'completed' | 'dropped'
          progress_percent?: number
          enrolled_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          id: string
          user_id: string | null
          course_id: string | null
          full_name: string
          email: string
          phone: string | null
          amount: number
          currency: string
          method: 'bank_transfer' | 'card' | 'cash' | 'other'
          reference: string | null
          status: 'pending' | 'confirmed' | 'declined' | 'refunded'
          note: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          course_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          amount: number
          currency?: string
          method?: 'bank_transfer' | 'card' | 'cash' | 'other'
          reference?: string | null
          status?: 'pending' | 'confirmed' | 'declined' | 'refunded'
          note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          course_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          amount?: number
          currency?: string
          method?: 'bank_transfer' | 'card' | 'cash' | 'other'
          reference?: string | null
          status?: 'pending' | 'confirmed' | 'declined' | 'refunded'
          note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          bucket: string
          key_hash: string
          request_count: number
          window_started: string
        }
        Insert: {
          bucket: string
          key_hash: string
          request_count?: number
          window_started?: string
        }
        Update: {
          bucket?: string
          key_hash?: string
          request_count?: number
          window_started?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          id: string
          verification_code: string
          certificate_number: string
          storage_path: string | null
          user_id: string | null
          course_id: string | null
          recipient_name: string
          course_title: string
          issue_date: string
          grade: string | null
          is_valid: boolean
          created_at: string
        }
        Insert: {
          id?: string
          verification_code: string
          certificate_number?: string
          storage_path?: string | null
          user_id?: string | null
          course_id?: string | null
          recipient_name: string
          course_title: string
          issue_date?: string
          grade?: string | null
          is_valid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          verification_code?: string
          certificate_number?: string
          storage_path?: string | null
          user_id?: string | null
          course_id?: string | null
          recipient_name?: string
          course_title?: string
          issue_date?: string
          grade?: string | null
          is_valid?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          user_id: string
          lesson_id: string
          is_completed: boolean
          watch_time_seconds: number
          last_watched_at: string | null
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          user_id: string
          lesson_id: string
          is_completed?: boolean
          watch_time_seconds?: number
          last_watched_at?: string | null
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          user_id?: string
          lesson_id?: string
          is_completed?: boolean
          watch_time_seconds?: number
          last_watched_at?: string | null
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_applications: {
        Row: {
          id: string
          user_id: string | null
          company_name: string
          founder_name: string
          email: string
          phone: string
          industry: string
          stage: 'idea' | 'prototype' | 'mvp' | 'early_revenue' | 'scaling'
          problem_statement: string
          solution_description: string
          pitch_deck_url: string | null
          support_needed: Json
          status: 'submitted' | 'under_review' | 'accepted' | 'waitlisted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_name: string
          founder_name: string
          email: string
          phone: string
          industry: string
          stage: 'idea' | 'prototype' | 'mvp' | 'early_revenue' | 'scaling'
          problem_statement: string
          solution_description: string
          pitch_deck_url?: string | null
          support_needed?: Json
          status?: 'submitted' | 'under_review' | 'accepted' | 'waitlisted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          company_name?: string
          founder_name?: string
          email?: string
          phone?: string
          industry?: string
          stage?: 'idea' | 'prototype' | 'mvp' | 'early_revenue' | 'scaling'
          problem_statement?: string
          solution_description?: string
          pitch_deck_url?: string | null
          support_needed?: Json
          status?: 'submitted' | 'under_review' | 'accepted' | 'waitlisted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_reviews: {
        Row: {
          id: string
          application_id: string
          reviewer_id: string
          score: number | null
          comments: string
          recommendation: 'accept' | 'interview' | 'decline' | 'request_more_info' | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          reviewer_id: string
          score?: number | null
          comments: string
          recommendation?: 'accept' | 'interview' | 'decline' | 'request_more_info' | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          reviewer_id?: string
          score?: number | null
          comments?: string
          recommendation?: 'accept' | 'interview' | 'decline' | 'request_more_info' | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "startup_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          subject: string
          message: string
          status: 'unread' | 'read' | 'responded' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          subject: string
          message: string
          status?: 'unread' | 'read' | 'responded' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          subject?: string
          message?: string
          status?: 'unread' | 'read' | 'responded' | 'archived'
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      consume_public_rate_limit: {
        Args: {
          p_bucket: string
          p_key_hash: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      verify_certificate: {
        Args: {
          p_verification_code: string
        }
        Returns: {
          certificate_number: string
          course_title: string
          issue_date: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}