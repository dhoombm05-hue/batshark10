export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_impact_log: {
        Row: {
          action_type: string
          change_reason: string | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          field_name: string | null
          id: string
          impact_on_growth: number | null
          impact_on_liquidity: number | null
          impact_on_net_profit: number | null
          is_manual_override: boolean | null
          new_value: string | null
          numeric_difference: number | null
          old_value: string | null
          risk_level: string | null
          section: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          action_type: string
          change_reason?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          field_name?: string | null
          id?: string
          impact_on_growth?: number | null
          impact_on_liquidity?: number | null
          impact_on_net_profit?: number | null
          is_manual_override?: boolean | null
          new_value?: string | null
          numeric_difference?: number | null
          old_value?: string | null
          risk_level?: string | null
          section?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          action_type?: string
          change_reason?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          field_name?: string | null
          id?: string
          impact_on_growth?: number | null
          impact_on_liquidity?: number | null
          impact_on_net_profit?: number | null
          is_manual_override?: boolean | null
          new_value?: string | null
          numeric_difference?: number | null
          old_value?: string | null
          risk_level?: string | null
          section?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_type: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_code: string | null
        }
        Insert: {
          account_type: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_code?: string | null
        }
        Update: {
          account_type?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_code?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          is_edited: boolean
          is_pinned: boolean
          message_type: string
          reactions: Json
          reply_to_id: string | null
          room_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean
          is_pinned?: boolean
          message_type?: string
          reactions?: Json
          reply_to_id?: string | null
          room_id: string
          user_id: string
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean
          is_pinned?: boolean
          message_type?: string
          reactions?: Json
          reply_to_id?: string | null
          room_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_settings: {
        Row: {
          allowed_roles: string[] | null
          created_at: string
          id: string
          is_private: boolean | null
          notification_sound: string | null
          notifications_enabled: boolean | null
          room_id: string
          theme_color: string | null
          updated_at: string
          wallpaper_opacity: number | null
          wallpaper_url: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          created_at?: string
          id?: string
          is_private?: boolean | null
          notification_sound?: string | null
          notifications_enabled?: boolean | null
          room_id: string
          theme_color?: string | null
          updated_at?: string
          wallpaper_opacity?: number | null
          wallpaper_url?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          created_at?: string
          id?: string
          is_private?: boolean | null
          notification_sound?: string | null
          notifications_enabled?: boolean | null
          room_id?: string
          theme_color?: string | null
          updated_at?: string
          wallpaper_opacity?: number | null
          wallpaper_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_settings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_table_cells: {
        Row: {
          cell_value: Json | null
          column_id: string
          created_at: string
          id: string
          row_id: string
          table_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cell_value?: Json | null
          column_id: string
          created_at?: string
          id?: string
          row_id: string
          table_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cell_value?: Json | null
          column_id?: string
          created_at?: string
          id?: string
          row_id?: string
          table_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_table_cells_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "custom_table_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_table_cells_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "custom_table_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_table_cells_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "custom_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_table_columns: {
        Row: {
          column_key: string
          column_name: string
          column_type: string
          created_at: string
          id: string
          position: number
          table_id: string
          updated_at: string
          updated_by: string | null
          width: number | null
        }
        Insert: {
          column_key: string
          column_name?: string
          column_type?: string
          created_at?: string
          id?: string
          position?: number
          table_id: string
          updated_at?: string
          updated_by?: string | null
          width?: number | null
        }
        Update: {
          column_key?: string
          column_name?: string
          column_type?: string
          created_at?: string
          id?: string
          position?: number
          table_id?: string
          updated_at?: string
          updated_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_table_columns_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "custom_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_table_rows: {
        Row: {
          created_at: string
          data: Json
          id: string
          position: number
          row_name: string | null
          table_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          position?: number
          row_name?: string | null
          table_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          position?: number
          row_name?: string | null
          table_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_table_rows_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "custom_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_table_versions: {
        Row: {
          data_snapshot: Json
          id: string
          notes: string | null
          saved_at: string
          saved_by: string
          table_id: string
          version_number: number
        }
        Insert: {
          data_snapshot?: Json
          id?: string
          notes?: string | null
          saved_at?: string
          saved_by: string
          table_id: string
          version_number?: number
        }
        Update: {
          data_snapshot?: Json
          id?: string
          notes?: string | null
          saved_at?: string
          saved_by?: string
          table_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_table_versions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "custom_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_tables: {
        Row: {
          columns: Json
          created_at: string
          created_by: string
          id: string
          name: string
          project_id: string | null
          table_type: string
          updated_at: string
        }
        Insert: {
          columns?: Json
          created_at?: string
          created_by: string
          id?: string
          name: string
          project_id?: string | null
          table_type?: string
          updated_at?: string
        }
        Update: {
          columns?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          project_id?: string | null
          table_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_tables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_imports: {
        Row: {
          cleaning_report: Json | null
          column_count: number | null
          completed_at: string | null
          created_at: string
          error_log: Json | null
          file_name: string
          file_type: string
          file_url: string | null
          id: string
          import_config: Json | null
          imported_by: string
          imported_by_name: string
          project_id: string | null
          row_count: number | null
          status: string
          target_table: string | null
        }
        Insert: {
          cleaning_report?: Json | null
          column_count?: number | null
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          file_name: string
          file_type?: string
          file_url?: string | null
          id?: string
          import_config?: Json | null
          imported_by: string
          imported_by_name?: string
          project_id?: string | null
          row_count?: number | null
          status?: string
          target_table?: string | null
        }
        Update: {
          cleaning_report?: Json | null
          column_count?: number | null
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          file_name?: string
          file_type?: string
          file_url?: string | null
          id?: string
          import_config?: Json | null
          imported_by?: string
          imported_by_name?: string
          project_id?: string | null
          row_count?: number | null
          status?: string
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_imports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          business_name: string | null
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          section: string | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          business_name?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          section?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string
        }
        Update: {
          business_name?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          section?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      employee_evaluations: {
        Row: {
          admin_rating: number
          budget_compliance: number
          communication: number
          created_at: string
          employee_id: string
          employee_name: string
          evaluation_month: string
          evaluation_year: number
          expense_exceeded: boolean
          goal_achievement: number
          id: string
          initiative: number
          notes: string | null
          overall_score: number
          projects_completed: number
          teamwork: number
        }
        Insert: {
          admin_rating: number
          budget_compliance: number
          communication: number
          created_at?: string
          employee_id: string
          employee_name: string
          evaluation_month: string
          evaluation_year: number
          expense_exceeded?: boolean
          goal_achievement: number
          id?: string
          initiative: number
          notes?: string | null
          overall_score: number
          projects_completed?: number
          teamwork: number
        }
        Update: {
          admin_rating?: number
          budget_compliance?: number
          communication?: number
          created_at?: string
          employee_id?: string
          employee_name?: string
          evaluation_month?: string
          evaluation_year?: number
          expense_exceeded?: boolean
          goal_achievement?: number
          id?: string
          initiative?: number
          notes?: string | null
          overall_score?: number
          projects_completed?: number
          teamwork?: number
        }
        Relationships: []
      }
      employee_monthly_performance: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          month: string
          month_order: number
          score: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          month: string
          month_order?: number
          score?: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          month?: string
          month_order?: number
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_monthly_performance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          achievements: string[] | null
          admin_notes: string | null
          age: number | null
          avatar_url: string | null
          bonus: number | null
          created_at: string
          department: string | null
          experience: string | null
          feedback: string | null
          id: string
          improvements: string[] | null
          kpi_achievement: number | null
          monthly_rating: number | null
          name: string
          performance: number | null
          position: string
          profit_contribution: number | null
          projects: string[] | null
          salary: number | null
          slug: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          achievements?: string[] | null
          admin_notes?: string | null
          age?: number | null
          avatar_url?: string | null
          bonus?: number | null
          created_at?: string
          department?: string | null
          experience?: string | null
          feedback?: string | null
          id?: string
          improvements?: string[] | null
          kpi_achievement?: number | null
          monthly_rating?: number | null
          name: string
          performance?: number | null
          position: string
          profit_contribution?: number | null
          projects?: string[] | null
          salary?: number | null
          slug: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          achievements?: string[] | null
          admin_notes?: string | null
          age?: number | null
          avatar_url?: string | null
          bonus?: number | null
          created_at?: string
          department?: string | null
          experience?: string | null
          feedback?: string | null
          id?: string
          improvements?: string[] | null
          kpi_achievement?: number | null
          monthly_rating?: number | null
          name?: string
          performance?: number | null
          position?: string
          profit_contribution?: number | null
          projects?: string[] | null
          salary?: number | null
          slug?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string
          description: string
          entry_date: string
          entry_number: number
          id: string
          is_balanced: boolean
          notes: string | null
          project_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description: string
          entry_date?: string
          entry_number?: number
          id?: string
          is_balanced?: boolean
          notes?: string | null
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          entry_date?: string
          entry_number?: number
          id?: string
          is_balanced?: boolean
          notes?: string | null
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_name: string
          account_type: string
          created_at: string
          credit: number
          debit: number
          id: string
          journal_entry_id: string
          notes: string | null
        }
        Insert: {
          account_name: string
          account_type?: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id: string
          notes?: string | null
        }
        Update: {
          account_name?: string
          account_type?: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_avatar: string | null
          author_id: string
          author_name: string
          comments_count: number
          content: string
          content_type: string
          created_at: string
          dislikes_count: number
          id: string
          is_pinned: boolean
          likes_count: number
          media_file_name: string | null
          media_url: string | null
          news_number: number
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar?: string | null
          author_id: string
          author_name?: string
          comments_count?: number
          content?: string
          content_type?: string
          created_at?: string
          dislikes_count?: number
          id?: string
          is_pinned?: boolean
          likes_count?: number
          media_file_name?: string | null
          media_url?: string | null
          news_number?: number
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          author_avatar?: string | null
          author_id?: string
          author_name?: string
          comments_count?: number
          content?: string
          content_type?: string
          created_at?: string
          dislikes_count?: number
          id?: string
          is_pinned?: boolean
          likes_count?: number
          media_file_name?: string | null
          media_url?: string | null
          news_number?: number
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      news_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          news_id: string
          updated_at: string
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          news_id: string
          updated_at?: string
          user_avatar?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          news_id?: string
          updated_at?: string
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      news_reactions: {
        Row: {
          created_at: string
          id: string
          news_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_reactions_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      news_read_status: {
        Row: {
          id: string
          news_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          news_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          news_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_read_status_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          id: string
          is_read: boolean
          link: string | null
          sender_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_cycles: {
        Row: {
          created_at: string
          creates_count: number
          cycle_end: string
          cycle_start: string
          deletes_count: number
          display_name: string
          final_score: number
          financial_impact: number
          id: string
          notes: string | null
          total_actions: number
          updates_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          creates_count?: number
          cycle_end?: string
          cycle_start: string
          deletes_count?: number
          display_name?: string
          final_score?: number
          financial_impact?: number
          id?: string
          notes?: string | null
          total_actions?: number
          updates_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          creates_count?: number
          cycle_end?: string
          cycle_start?: string
          deletes_count?: number
          display_name?: string
          final_score?: number
          financial_impact?: number
          id?: string
          notes?: string | null
          total_actions?: number
          updates_count?: number
          user_id?: string
        }
        Relationships: []
      }
      private_conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          sender_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "private_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string
          id: string
          job_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name: string
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_analysis: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          sort_order: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          sort_order?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          notes: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_monthly_data: {
        Row: {
          created_at: string
          expenses: number
          id: string
          month: string
          month_order: number
          profit: number
          project_id: string
          revenue: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expenses?: number
          id?: string
          month: string
          month_order?: number
          profit?: number
          project_id: string
          revenue?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expenses?: number
          id?: string
          month?: string
          month_order?: number
          profit?: number
          project_id?: string
          revenue?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_monthly_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_revenues: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string | null
          id: string
          notes: string | null
          project_id: string
          source: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string | null
          id?: string
          notes?: string | null
          project_id: string
          source: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_revenues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          campaign_count: number
          client_count: number
          created_at: string
          data_reliability_score: number
          description: string | null
          growth_rate: number
          id: string
          name: string
          name_en: string | null
          net_profit: number
          occupancy_rate: number | null
          override_growth_rate: number | null
          override_net_profit: number | null
          override_total_expenses: number | null
          override_total_revenue: number | null
          slug: string
          status: string
          total_expenses: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          campaign_count?: number
          client_count?: number
          created_at?: string
          data_reliability_score?: number
          description?: string | null
          growth_rate?: number
          id?: string
          name: string
          name_en?: string | null
          net_profit?: number
          occupancy_rate?: number | null
          override_growth_rate?: number | null
          override_net_profit?: number | null
          override_total_expenses?: number | null
          override_total_revenue?: number | null
          slug: string
          status?: string
          total_expenses?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          campaign_count?: number
          client_count?: number
          created_at?: string
          data_reliability_score?: number
          description?: string | null
          growth_rate?: number
          id?: string
          name?: string
          name_en?: string | null
          net_profit?: number
          occupancy_rate?: number | null
          override_growth_rate?: number | null
          override_net_profit?: number | null
          override_total_expenses?: number | null
          override_total_revenue?: number | null
          slug?: string
          status?: string
          total_expenses?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          category: string | null
          created_at: string
          created_by: string
          created_by_name: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string | null
          sort_order: number
          source_id: string | null
          source_label: string | null
          source_type: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          created_by_name?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          sort_order?: number
          source_id?: string | null
          source_label?: string | null
          source_type?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          sort_order?: number
          source_id?: string | null
          source_label?: string | null
          source_type?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          chat_wallpaper_blur: number
          chat_wallpaper_opacity: number
          chat_wallpaper_overlay: string | null
          chat_wallpaper_url: string | null
          created_at: string
          custom_bg_url: string | null
          id: string
          section_backgrounds: Json
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_wallpaper_blur?: number
          chat_wallpaper_opacity?: number
          chat_wallpaper_overlay?: string | null
          chat_wallpaper_url?: string | null
          created_at?: string
          custom_bg_url?: string | null
          id?: string
          section_backgrounds?: Json
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_wallpaper_blur?: number
          chat_wallpaper_opacity?: number
          chat_wallpaper_overlay?: string | null
          chat_wallpaper_url?: string | null
          created_at?: string
          custom_bg_url?: string | null
          id?: string
          section_backgrounds?: Json
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "ceo"
        | "coo"
        | "strategic_director"
        | "marketing_director"
        | "tech_director"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "ceo",
        "coo",
        "strategic_director",
        "marketing_director",
        "tech_director",
      ],
    },
  },
} as const
