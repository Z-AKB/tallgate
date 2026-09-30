export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          role_id?: string
          role?: string
          assigned_at?: string
          granted_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id?: string
          role?: string
          assigned_at?: string
          granted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          role?: string
          assigned_at?: string
          granted_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          content_type: 'course' | 'article' | 'project'
        }
        Insert: {
          id?: string
          name: string
          slug: string
          content_type: 'course' | 'article' | 'project'
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          content_type?: 'course' | 'article' | 'project'
        }
        Relationships: []
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
        Relationships: []
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
          duration_weeks?: number | null
          short_description?: string
          overview?: string
          learning_outcomes?: Json
          prerequisites?: string | null
          is_popular?: boolean
          is_published?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
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
        Relationships: []
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          content_type: 'video' | 'text'
          duration_minutes: number
          order_index: number
          is_preview: boolean
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          content_type?: 'video' | 'text'
          duration_minutes?: number
          order_index?: number
          is_preview?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          content_type?: 'video' | 'text'
          duration_minutes?: number
          order_index?: number
          is_preview?: boolean
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      enrollments: {
        Row: {
          id: string
          learner_id: string
          course_id: string
          status: 'active' | 'completed'
          enrolled_at: string
        }
        Insert: {
          id?: string
          learner_id: string
          course_id: string
          status?: 'active' | 'completed'
          enrolled_at?: string
        }
        Update: {
          id?: string
          learner_id?: string
          course_id?: string
          status?: 'active' | 'completed'
          enrolled_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      lesson_progress: {
        Row: {
          id: string
          enrollment_id: string
          lesson_id: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          enrollment_id: string
          lesson_id: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          enrollment_id?: string
          lesson_id?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          id: string
          verification_code?: string
          certificate_number?: string
          user_id?: string
          learner_id?: string
          enrollment_id?: string
          course_id?: string
          recipient_name?: string
          course_title?: string
          issue_date?: string
          issued_at?: string
          grade: string | null
          is_valid?: boolean
          created_at?: string
        }
        Insert: {
          id?: string
          verification_code?: string
          certificate_number?: string
          user_id?: string
          learner_id?: string
          enrollment_id?: string
          course_id?: string
          recipient_name?: string
          course_title?: string
          issue_date?: string
          issued_at?: string
          grade?: string | null
          is_valid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          verification_code?: string
          certificate_number?: string
          user_id?: string
          learner_id?: string
          enrollment_id?: string
          course_id?: string
          recipient_name?: string
          course_title?: string
          issue_date?: string
          issued_at?: string
          grade?: string | null
          is_valid?: boolean
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
