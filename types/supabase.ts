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
 *   supabase/migrations/20261011000000_admin_audit_log.sql
 *   supabase/migrations/20261012000000_assessments.sql
 *
 * Tables that exist only in earlier revisions (enrollments, categories) and
 * columns dropped by later migrations (lessons.content_markdown) have been
 * removed. `Relationships` mirrors the foreign keys declared in the
 * migrations so embedded resource selects type-resolve.
 */
export interface Database {
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          target: string | null
          outcome: "success" | "failure"
          details: unknown | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          target?: string | null
          outcome?: "success" | "failure"
          details?: unknown | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          target?: string | null
          outcome?: "success" | "failure"
          details?: unknown | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
          auto_issue_certificate: boolean
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
          auto_issue_certificate?: boolean
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
          auto_issue_certificate?: boolean
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
          certificate_type: "course_linked" | "independent"
          issuance_reason: string | null
          issuance_reason_legacy_exempt: boolean
          storage_path: string | null
          user_id: string | null
          course_id: string | null
          recipient_name: string
          course_title: string
          issue_date: string
          grade: string | null
          is_valid: boolean
          created_at: string
          email_status: string | null
          email_sent_at: string | null
          email_error: string | null
          email_retry_count: number | null
          email_lease_token: string | null
          email_lease_acquired_at: string | null
        }
        Insert: {
          id?: string
          verification_code: string
          certificate_number?: string
          certificate_type?: "course_linked" | "independent"
          issuance_reason?: string | null
          issuance_reason_legacy_exempt?: boolean
          storage_path?: string | null
          user_id?: string | null
          course_id?: string | null
          recipient_name: string
          course_title: string
          issue_date?: string
          grade?: string | null
          is_valid?: boolean
          created_at?: string
          email_status?: string | null
          email_sent_at?: string | null
          email_error?: string | null
          email_retry_count?: number | null
          email_lease_token?: string | null
          email_lease_acquired_at?: string | null
        }
        Update: {
          id?: string
          verification_code?: string
          certificate_number?: string
          certificate_type?: "course_linked" | "independent"
          issuance_reason?: string | null
          issuance_reason_legacy_exempt?: boolean
          storage_path?: string | null
          user_id?: string | null
          course_id?: string | null
          recipient_name?: string
          course_title?: string
          issue_date?: string
          grade?: string | null
          is_valid?: boolean
          created_at?: string
          email_status?: string | null
          email_sent_at?: string | null
          email_error?: string | null
          email_retry_count?: number | null
          email_lease_token?: string | null
          email_lease_acquired_at?: string | null
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
      questions: {
        Row: {
          id: string
          course_id: string
          module_id: string | null
          type: 'single' | 'multiple' | 'true_false' | 'short' | 'essay'
          prompt: string
          explanation: string | null
          points: number
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          module_id?: string | null
          type: 'single' | 'multiple' | 'true_false' | 'short' | 'essay'
          prompt: string
          explanation?: string | null
          points?: number
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          module_id?: string | null
          type?: 'single' | 'multiple' | 'true_false' | 'short' | 'essay'
          prompt?: string
          explanation?: string | null
          points?: number
          is_published?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          label: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          label: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          label?: string
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_answers: {
        Row: {
          question_id: string
          correct_option_ids: string[]
          accepted_answers: string[]
          created_at: string
        }
        Insert: {
          question_id: string
          correct_option_ids?: string[]
          accepted_answers?: string[]
          created_at?: string
        }
        Update: {
          question_id?: string
          correct_option_ids?: string[]
          accepted_answers?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          id: string
          course_id: string
          module_id: string | null
          kind: 'quiz' | 'practice' | 'exam'
          title: string
          instructions: string | null
          time_limit_minutes: number | null
          pass_mark_percent: number
          max_attempts: number | null
          retake_cooldown_minutes: number | null
          shuffle_questions: boolean
          shuffle_options: boolean
          feedback_mode: 'immediate' | 'after_submit'
          question_count: number | null
          is_required: boolean
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          module_id?: string | null
          kind?: 'quiz' | 'practice' | 'exam'
          title: string
          instructions?: string | null
          time_limit_minutes?: number | null
          pass_mark_percent?: number
          max_attempts?: number | null
          retake_cooldown_minutes?: number | null
          shuffle_questions?: boolean
          shuffle_options?: boolean
          feedback_mode?: 'immediate' | 'after_submit'
          question_count?: number | null
          is_required?: boolean
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          module_id?: string | null
          kind?: 'quiz' | 'practice' | 'exam'
          title?: string
          instructions?: string | null
          time_limit_minutes?: number | null
          pass_mark_percent?: number
          max_attempts?: number | null
          retake_cooldown_minutes?: number | null
          shuffle_questions?: boolean
          shuffle_options?: boolean
          feedback_mode?: 'immediate' | 'after_submit'
          question_count?: number | null
          is_required?: boolean
          is_published?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          quiz_id: string
          question_id: string
          display_order: number
        }
        Insert: {
          quiz_id: string
          question_id: string
          display_order?: number
        }
        Update: {
          quiz_id?: string
          question_id?: string
          display_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          attempt_no: number
          started_at: string
          expires_at: string | null
          submitted_at: string | null
          question_order: Json
          score_points: number
          max_points: number
          percent: number | null
          passed: boolean | null
          status: 'in_progress' | 'submitted' | 'pending_grading' | 'graded'
          tab_switch_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          attempt_no?: number
          started_at?: string
          expires_at?: string | null
          submitted_at?: string | null
          question_order?: Json
          score_points?: number
          max_points?: number
          percent?: number | null
          passed?: boolean | null
          status?: 'in_progress' | 'submitted' | 'pending_grading' | 'graded'
          tab_switch_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          attempt_no?: number
          started_at?: string
          expires_at?: string | null
          submitted_at?: string | null
          question_order?: Json
          score_points?: number
          max_points?: number
          percent?: number | null
          passed?: boolean | null
          status?: 'in_progress' | 'submitted' | 'pending_grading' | 'graded'
          tab_switch_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_ids: string[]
          text_answer: string | null
          is_correct: boolean | null
          points_awarded: number
          grader_feedback: string | null
          graded_at: string | null
          graded_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_ids?: string[]
          text_answer?: string | null
          is_correct?: boolean | null
          points_awarded?: number
          grader_feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_option_ids?: string[]
          text_answer?: string | null
          is_correct?: boolean | null
          points_awarded?: number
          grader_feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recall_progress: {
        Row: {
          user_id: string
          question_id: string
          box: number
          next_review_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          question_id: string
          box?: number
          next_review_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          question_id?: string
          box?: number
          next_review_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recall_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recall_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
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
      is_enrolled: {
        Args: {
          p_course_id: string
        }
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
      start_quiz_attempt: {
        Args: {
          p_quiz_id: string
        }
        Returns: {
          attemptId: string
          resumed: boolean
          startedAt: string | null
          expiresAt: string | null
          maxPoints: number
          status: string
          questionOrder: Json
        }
      }
      save_attempt_answer: {
        Args: {
          p_attempt_id: string
          p_question_id: string
          p_selected_option_ids?: string[]
          p_text_answer?: string | null
        }
        Returns: {
          saved: boolean
        }
      }
      submit_quiz_attempt: {
        Args: {
          p_attempt_id: string
        }
        Returns: {
          attemptId: string
          status: string
          scorePoints: number
          maxPoints: number
          percent: number | null
          passed: boolean | null
          submittedAt: string | null
        }
      }
      log_attempt_tab_switch: {
        Args: {
          p_attempt_id: string
        }
        Returns: {
          tabSwitchCount: number
        }
      }
      get_attempt_review: {
        Args: {
          p_attempt_id: string
        }
        Returns: Json
      }
      grade_attempt_answer: {
        Args: {
          p_attempt_id: string
          p_question_id: string
          p_points: number
          p_feedback?: string | null
        }
        Returns: {
          attemptId: string
          scorePoints: number
          maxPoints: number
          percent: number
          status: string
        }
      }
      recompute_course_completion: {
        Args: {
          p_user_id: string
          p_course_id: string
        }
        Returns: {
          isComplete: boolean
          newlyCompleted: boolean
          progressPercent: number
        }
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
      update_payment_request_status: {
        Args: {
          p_payment_id: string
          p_next_status: string
          p_note?: string | null
          p_reference?: string | null
        }
        Returns: boolean
      }
      is_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_certificate_email_status: {
        Args: {
          p_certificate_id: string
          p_email_status?: string | null
          p_set_email_status?: boolean
          p_email_sent_at?: string | null
          p_set_email_sent_at?: boolean
          p_email_lease_token?: string | null
          p_set_email_lease_token?: boolean
          p_email_lease_acquired_at?: string | null
          p_set_email_lease_acquired_at?: boolean
          p_email_error?: string | null
          p_set_email_error?: boolean
          p_email_retry_count?: number | null
          p_set_email_retry_count?: boolean
        }
        Returns: boolean
      }
      claim_certificate_email_lease: {
        Args: {
          p_certificate_id: string
          p_lease_token: string
          p_lease_timeout?: string
        }
        Returns: {
          claimed: boolean
          current_status: string | null
          current_lease_token: string | null
          current_retry_count: number | null
        }[]
      }
      complete_certificate_email_lease: {
        Args: {
          p_certificate_id: string
          p_lease_token: string
          p_email_status: string
          p_email_error?: string | null
        }
        Returns: boolean
      }
      release_stale_certificate_email_leases: {
        Args: {
          p_lease_timeout_interval?: string
        }
        Returns: number
      }
      issue_independent_certificate_with_audit: {
        Args: {
          p_actor_id: string
          p_user_id: string
          p_recipient_name: string
          p_course_title: string
          p_issuance_reason: string
          p_grade: string
          p_issue_date: string
          p_verification_code: string
        }
        Returns: Database["public"]["Tables"]["certificates"]["Row"]
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
