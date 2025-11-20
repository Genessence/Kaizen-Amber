/**
 * TypeScript type definitions for backend API
 * Matches FastAPI backend schemas
 */

// ============= User Types =============

export type UserRole = "plant" | "hq";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  plant_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithPlant extends User {
  plant_name?: string;
  plant_short_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// ============= Plant Types =============

export interface Plant {
  id: string;
  name: string;
  short_name: string;
  division: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlantWithStats extends Plant {
  total_practices: number;
  total_savings: number;
  benchmarked_count: number;
  monthly_practices: number;
}

// ============= Category Types =============

export interface Category {
  id: string;
  name: string;
  slug: string;
  color_class: string;
  icon_name: string;
  created_at: string;
}

export interface CategoryWithCount extends Category {
  practice_count: number;
}

// ============= Best Practice Types =============

export type SavingsCurrency = "lakhs" | "crores";
export type SavingsPeriod = "monthly" | "annually";
export type PracticeStatus = "draft" | "submitted" | "approved" | "revision_required";
export type ImageType = "before" | "after";

export interface PracticeImage {
  id: string;
  practice_id: string;
  image_type: ImageType;
  blob_container: string;
  blob_name: string;
  blob_url: string;
  file_size: number;
  content_type: string;
  uploaded_at: string;
}

export interface PracticeDocument {
  id: string;
  practice_id: string;
  document_name: string;
  blob_container: string;
  blob_name: string;
  blob_url: string;
  file_size: number;
  content_type: string;
  uploaded_at: string;
}

export interface BestPractice {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name?: string;
  submitted_by_user_id: string;
  submitted_by_name?: string;
  plant_id: string;
  plant_name?: string;
  problem_statement: string;
  solution: string;
  benefits?: string[];
  metrics?: string;
  implementation?: string;
  investment?: string;
  savings_amount?: number;
  savings_currency?: SavingsCurrency;
  savings_period?: SavingsPeriod;
  area_implemented?: string;
  status: PracticeStatus;
  submitted_date?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  is_benchmarked?: boolean;
  question_count?: number;
  copy_count?: number;
  images?: PracticeImage[];
  documents?: PracticeDocument[];
}

export interface BestPracticeListItem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name: string;
  plant_id: string;
  plant_name: string;
  submitted_by_name: string;
  submitted_date?: string;
  status: PracticeStatus;
  savings_amount?: number;
  savings_currency?: SavingsCurrency;
  is_benchmarked: boolean;
  question_count: number;
  has_images: boolean;
  created_at: string;
}

export interface BestPracticeCreate {
  title: string;
  description: string;
  category_id: string;
  plant_id?: string;
  problem_statement: string;
  solution: string;
  benefits?: string[];
  metrics?: string;
  implementation?: string;
  investment?: string;
  savings_amount?: number;
  savings_currency?: SavingsCurrency;
  savings_period?: SavingsPeriod;
  area_implemented?: string;
  status?: PracticeStatus;
  submitted_date?: string;
}

// ============= Benchmarking Types =============

export interface BenchmarkedPractice {
  id: string;
  practice_id: string;
  benchmarked_by_user_id: string;
  benchmarked_date: string;
  created_at: string;
}

export interface CopyDetail {
  plant_id: string;
  plant_name: string;
  copied_date: string;
}

export interface CopySpreadItem {
  bp_id: string;
  bp_title: string;
  origin_plant_id: string;
  origin_plant_name: string;
  copy_count: number;
  copies: CopyDetail[];
}

// ============= Copy & Implement Types =============

export type ImplementationStatus = "planning" | "in_progress" | "completed";

export interface CopyImplementRequest {
  original_practice_id: string;
  customized_title?: string;
  customized_solution?: string;
  implementation_status?: ImplementationStatus;
}

export interface CopyImplementResponse {
  success: boolean;
  data: {
    copied_practice: BestPractice;
    copy_record: {
      id: string;
      original_practice_id: string;
      copied_practice_id: string;
      copying_plant_id: string;
      copied_date: string;
      implementation_status: ImplementationStatus;
      created_at: string;
    };
    points_awarded: {
      origin_points: number;
      copier_points: number;
      origin_plant_id: string;
      copying_plant_id: string;
    };
  };
  message: string;
}

// ============= Question Types =============

export interface Question {
  id: string;
  practice_id: string;
  asked_by_user_id: string;
  asked_by_name: string;
  question_text: string;
  answer_text?: string;
  answered_by_user_id?: string;
  answered_by_name?: string;
  answered_at?: string;
  created_at: string;
}

// ============= Leaderboard Types =============

export type EntryType = "Origin" | "Copier";

export interface LeaderboardBreakdownEntry {
  type: EntryType;
  points: number;
  date: string;
  bp_title: string;
  bp_id?: string;
}

export interface LeaderboardEntry {
  plant_id: string;
  plant_name: string;
  total_points: number;
  origin_points: number;
  copier_points: number;
  rank: number;
  breakdown: LeaderboardBreakdownEntry[];
}

export interface PlantLeaderboardBreakdown {
  plant_id: string;
  plant_name: string;
  copied: {
    bp_title: string;
    bp_id: string;
    points: number;
    date: string;
  }[];
  copiedCount: number;
  copiedPoints: number;
  originated: {
    bp_title: string;
    bp_id: string;
    copies_count: number;
    points: number;
  }[];
  originatedCount: number;
  originatedPoints: number;
}

// ============= Analytics Types =============

export type PeriodType = "yearly" | "monthly";
export type CurrencyFormat = "lakhs" | "crores";

export interface DashboardOverview {
  monthly_count: number;
  ytd_count: number;
  monthly_savings: string;
  ytd_savings: string;
  stars: number;
  benchmarked_count: number;
  currency: CurrencyFormat;
}

export interface PlantPerformance {
  plant_id: string;
  plant_name: string;
  short_name: string;
  submitted: number;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_slug: string;
  practice_count: number;
  color_class: string;
  icon_name: string;
}

export interface PlantSavings {
  plant_id: string;
  plant_name: string;
  short_name: string;
  last_month: string;
  current_month: string;
  ytd_till_last_month: string;
  ytd_total: string;
  percent_change: number;
}

export interface PracticeSavingsDetail {
  practice_id: string;
  title: string;
  savings: string;
  benchmarked: boolean;
  submitted_date: string;
}

export interface MonthlySavingsBreakdown {
  month: string;
  total_savings: string;
  practice_count: number;
  practices: PracticeSavingsDetail[];
}

export interface StarRating {
  plant_id: string;
  plant_name: string;
  monthly_savings: string;
  ytd_savings: string;
  stars: number;
  currency: CurrencyFormat;
}

export interface MonthlyTrend {
  month: string;
  savings: string;
  stars: number;
}

export interface BenchmarkStats {
  plant_id: string;
  plant_name: string;
  benchmarked_count: number;
}

// ============= File Upload Types =============

export interface PresignedUrlRequest {
  practice_id: string;
  file_type: "image" | "document";
  image_type?: ImageType;
  filename: string;
  content_type: string;
  file_size: number;
}

export interface PresignedUrlResponse {
  upload_url: string;
  blob_name: string;
  container: string;
  expiry: string;
}

// ============= API Response Wrappers =============

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface APIError {
  detail: string;
}

