/**
 * API Service Layer
 * Handles all communication with the Node.js backend
 */

/**
 * Format a date string to relative time (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return 'Just now';
}

import type {
  User,
  UserWithPlant,
  LoginRequest,
  TokenResponse,
  Plant,
  PlantWithStats,
  Category,
  CategoryWithCount,
  BestPractice,
  BestPracticeListItem,
  BestPracticeCreate,
  PaginatedResponse,
  APIResponse,
  CopyImplementRequest,
  CopyImplementResponse,
  Question,
  LeaderboardEntry,
  PlantLeaderboardBreakdown,
  DashboardOverview,
  PlantPerformance,
  CategoryBreakdown,
  PlantSavings,
  MonthlySavingsBreakdown,
  StarRating,
  MonthlyTrend,
  BenchmarkStats,
  CopySpreadItem,
  CopyDetail,
  PeriodType,
  CurrencyFormat,
  PresignedUrlRequest,
  PresignedUrlResponse,
  PracticeImage,
  PracticeDocument,
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Mock data imports removed - all endpoints now use real backend APIs

class APIService {
  /**
   * Get authorization header with JWT token
   */
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Generic request wrapper with error handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Ensure method is explicitly set and preserved (method must come after spreading options)
    const method = options.method || 'GET';
    
    try {
      const requestOptions: RequestInit = {
        ...options,
        method: method, // Set method after spreading to ensure it's not overwritten
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'include', // Include credentials for CORS
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
          ...options.headers,
        },
      };
      
      console.log('API Request:', { 
        endpoint, 
        method, 
        url: `${API_BASE_URL}${endpoint}`,
        headers: requestOptions.headers,
        body: requestOptions.body
      });
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
      
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });

      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      // Parse JSON response
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const jsonData = await response.json();
          console.log('Parsed JSON response:', jsonData);
          return jsonData;
        } else {
          // If not JSON, try to get text
          const textData = await response.text();
          console.warn('Non-JSON response received:', textData);
          throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } catch (error) {
      console.error('API Request Error:', {
        endpoint,
        method,
        url: `${API_BASE_URL}${endpoint}`,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof TypeError ? 'TypeError (likely CORS/Network)' : 'Other',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // NetworkError or CORS error
        throw new Error(
          `Network error: Unable to reach the server. This may be a CORS issue. ` +
          `Please check: (1) Backend server is running, (2) CORS is configured for ${window.location.origin}, ` +
          `(3) Network connectivity. Original error: ${error.message}`
        );
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // ============= Authentication =============

  /**
   * Login with email and password
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<TokenResponse> {
    const data = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });

    // Store tokens
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    return data;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserWithPlant> {
    return this.request<UserWithPlant>('/auth/me');
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ access_token: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const data = await this.request<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    localStorage.setItem('access_token', data.access_token);
    return data;
  }

  // ============= Plants =============

  /**
   * List all plants
   */
  async listPlants(isActive?: boolean): Promise<Plant[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    const query = params.toString();
    return this.request<Plant[]>(`/plants${query ? '?' + query : ''}`);
  }

  /**
   * Get plant details with statistics
   */
  async getPlant(plantId: string): Promise<PlantWithStats> {
    return this.request<PlantWithStats>(`/plants/${plantId}`);
  }

  /**
   * Get active plants only
   */
  async getActivePlants(): Promise<Plant[]> {
    return this.request<Plant[]>('/plants/active');
  }

  // ============= Categories =============

  /**
   * List all categories with practice counts
   */
  async listCategories(): Promise<CategoryWithCount[]> {
    return this.request<CategoryWithCount[]>('/categories');
  }

  /**
   * Get category details
   */
  async getCategory(categoryId: string): Promise<CategoryWithCount> {
    return this.request<CategoryWithCount>(`/categories/${categoryId}`);
  }

  // ============= Best Practices =============

  /**
   * List best practices with filters and pagination
   */
  async listBestPractices(params?: {
    category_id?: string;
    plant_id?: string;
    status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    is_benchmarked?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<BestPracticeListItem>> {
    const queryParams = new URLSearchParams();
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.plant_id) queryParams.append('plant_id', params.plant_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_benchmarked !== undefined) {
      // Convert boolean to string 'true' or 'false'
      queryParams.append('is_benchmarked', params.is_benchmarked ? 'true' : 'false');
    }
    if (params?.limit) queryParams.append('page_size', params.limit.toString());
    if (params?.offset) {
      const page = Math.floor(params.offset / (params.limit || 20)) + 1;
      queryParams.append('page', page.toString());
    }

    const response = await this.request<{
      items: any[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(`/best-practices?${queryParams.toString()}`);

    return {
      success: true,
      data: response.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category_id: item.category?.id || item.category_id,
        category_name: item.category?.name || (typeof item.category === 'string' ? item.category : ''),
        category: item.category?.name || (typeof item.category === 'string' ? item.category : ''),
        plant_id: item.plant?.id || item.plant_id,
        plant_name: item.plant?.name || (typeof item.plant === 'string' ? item.plant : ''),
        plant: item.plant?.name || (typeof item.plant === 'string' ? item.plant : ''),
        status: item.status,
        is_benchmarked: item.is_benchmarked || false,
        submitted_date: item.submitted_date,
        created_at: item.created_at,
      })),
      pagination: {
        total: response.total,
        limit: response.page_size,
        offset: (response.page - 1) * response.page_size,
        has_more: response.page < response.total_pages,
      },
    };
  }

  /**
   * Get single best practice with full details
   */
  async getBestPractice(practiceId: string): Promise<BestPractice> {
    const data = await this.request<any>(`/best-practices/${practiceId}`);
    
    // Transform backend response to match frontend type
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category_id: data.category?.id || data.category_id,
      category_name: data.category?.name || data.category,
      category: data.category?.name || data.category,
      submitted_by_user_id: data.submitted_by?.id || data.submitted_by_user_id,
      submitted_by_name: data.submitted_by?.full_name || data.submitted_by,
      submitted_by: data.submitted_by?.full_name || data.submitted_by,
      plant_id: data.plant?.id || data.plant_id,
      plant_name: data.plant?.name || data.plant,
      plant: data.plant?.name || data.plant,
      problem_statement: data.problem_statement,
      solution: data.solution,
      benefits: data.benefits,
      metrics: data.metrics,
      implementation: data.implementation,
      investment: data.investment,
      savings_amount: data.savings_amount,
      savings_currency: data.savings_currency,
      savings_period: data.savings_period,
      area_implemented: data.area_implemented,
      status: data.status,
      submitted_date: data.submitted_date,
      is_benchmarked: data.is_benchmarked || false,
      benchmarked_date: data.benchmarked_date,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Create new best practice
   */
  async createBestPractice(data: BestPracticeCreate): Promise<BestPractice> {
    const response = await this.request<any>('/best-practices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Fetch full details
    return this.getBestPractice(response.id);
  }

  /**
   * Update best practice
   */
  async updateBestPractice(practiceId: string, data: Partial<BestPracticeCreate>): Promise<BestPractice> {
    await this.request(`/best-practices/${practiceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    // Fetch updated practice
    return this.getBestPractice(practiceId);
  }

  /**
   * Delete best practice (soft delete)
   */
  async deleteBestPractice(practiceId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/best-practices/${practiceId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get my plant's practices
   */
  async getMyPractices(): Promise<BestPracticeListItem[]> {
    const data = await this.request<any[]>('/best-practices/my-practices');
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      plant: item.plant,
      status: item.status,
      is_benchmarked: item.is_benchmarked || false,
      submitted_date: item.submitted_date,
      created_at: item.created_at,
    }));
  }

  /**
   * Get recent best practices
   */
  async getRecentPractices(limit: number = 10): Promise<BestPracticeListItem[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    const data = await this.request<any[]>(`/best-practices/recent?${params.toString()}`);
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      plant: item.plant,
      status: item.status,
      is_benchmarked: item.is_benchmarked || false,
      submitted_date: item.submitted_date,
      created_at: item.created_at,
    }));
  }

  // ============= Benchmarking =============

  /**
   * Benchmark a practice (HQ only)
   */
  async benchmarkPractice(practiceId: string): Promise<{ id: string; practice_id: string; benchmarked_by_user_id: string; benchmarked_date: string; created_at: string }> {
    return this.request(`/benchmarking/benchmark/${practiceId}`, {
      method: 'POST',
    });
  }

  /**
   * Unbenchmark a practice (HQ only)
   */
  async unbenchmarkPractice(practiceId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/benchmarking/unbenchmark/${practiceId}`, {
      method: 'DELETE',
    });
  }

  /**
   * List all benchmarked practices
   */
  async listBenchmarkedPractices(params?: {
    plant_id?: string;
    category_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.plant_id) queryParams.append('plant_id', params.plant_id);
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.limit) queryParams.append('page_size', params.limit.toString());
    if (params?.offset) {
      const page = Math.floor(params.offset / (params.limit || 20)) + 1;
      queryParams.append('page', page.toString());
    }

    const response = await this.request<{
      items: any[];
      total: number;
    }>(`/benchmarking/list?${queryParams.toString()}`);

    return response.items.map((item) => ({
      id: item.id,
      practice_id: item.id,
      practice_title: item.title,
      practice_category: item.category?.name || '',
      plant_name: item.plant?.name || item.plant_name,
      benchmarked_date: item.benchmarked_date,
      copy_count: 0,
    }));
  }

  /**
   * Get recent benchmarked practices
   */
  async getRecentBenchmarkedPractices(limit: number = 10): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    const data = await this.request<any[]>(`/benchmarking/recent?${params.toString()}`);
    return data.map((item) => ({
      id: item.id,
      practice_id: item.id,
      practice_title: item.title,
      practice_category: item.category?.name || '',
      plant_name: item.plant_name,
      benchmarked_date: item.benchmarked_date,
      copy_count: 0, // Would need separate query
    }));
  }

  /**
   * Get plants that copied a practice
   */
  async getPracticeCopies(practiceId: string): Promise<CopyDetail[]> {
    const data = await this.request<any[]>(`/benchmarking/copies/${practiceId}`);
    return data.map((item) => ({
      id: item.id,
      copied_practice_id: item.copied_practice_id,
      copying_plant: item.copying_plant,
      copied_date: item.copied_date,
      implementation_status: item.implementation_status,
    }));
  }

  /**
   * Get total benchmarked count
   */
  async getTotalBenchmarkedCount(): Promise<{ total_benchmarked: number }> {
    return this.request<{ total_benchmarked: number }>('/benchmarking/total-count');
  }

  /**
   * Get copy spread (horizontal deployment status)
   */
  async getCopySpread(limit: number = 50): Promise<CopySpreadItem[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    const data = await this.request<any[]>(`/benchmarking/copy-spread?${params.toString()}`);
    return data.map((item) => ({
      bp_id: '', // Backend doesn't return this
      bp: item.bp,
      origin: item.origin,
      copies: item.copies || [],
    }));
  }

  // ============= Copy & Implement =============

  /**
   * Copy and implement a benchmarked practice
   */
  async copyAndImplement(data: CopyImplementRequest): Promise<CopyImplementResponse> {
    const response = await this.request<any>('/copy-implement/copy', {
      method: 'POST',
      body: JSON.stringify({
        original_practice_id: data.original_practice_id,
        title: data.customized_title,
        description: data.customized_description,
        problem_statement: data.customized_problem_statement,
        solution: data.customized_solution,
        implementation_status: data.implementation_status || 'planning',
      }),
    });

    // Fetch the original practice to get origin plant ID
    const originalPractice = await this.getBestPractice(data.original_practice_id);
    const originPlantId = originalPractice?.plant_id || '';

    // Fetch the full copied practice details
    const copiedPractice = await this.getBestPractice(response.id);

    return {
      success: true,
      data: {
        copied_practice: copiedPractice,
        copy_record: {
          id: response.id, // This is the copied practice ID
          original_practice_id: data.original_practice_id,
          copied_practice_id: response.id,
          copying_plant_id: response.copying_plant.id,
          copied_date: response.copied_date,
          implementation_status: response.implementation_status,
          created_at: response.copied_date,
        },
        points_awarded: {
          origin_points: 10, // Backend awards 10 points to origin plant
          copier_points: 5, // Backend awards 5 points to copying plant
          origin_plant_id: originPlantId,
          copying_plant_id: response.copying_plant.id,
        },
      },
      message: 'Practice copied successfully',
    };
  }

  /**
   * Get my implementations (copied practices)
   */
  async getMyImplementations(): Promise<BestPracticeListItem[]> {
    const data = await this.request<any[]>('/copy-implement/my-implementations');
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      plant: item.plant,
      status: item.status,
      is_benchmarked: false,
      submitted_date: item.copied_date,
      created_at: item.copied_date,
    }));
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(limit: number = 50): Promise<APIResponse<CopySpreadItem[]>> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    const data = await this.request<any[]>(`/copy-implement/deployment-status?${params.toString()}`);
    
    return {
      success: true,
      data: data.data.map((item) => ({
        bp_id: '',
        bp: item.bp,
        origin: item.origin,
        copies: item.copies || [],
      })),
    };
  }

  // ============= Questions =============

  /**
   * Get questions for a practice
   */
  async getPracticeQuestions(practiceId: string): Promise<Question[]> {
    const data = await this.request<any[]>(`/questions/practice/${practiceId}`);
    return data.map((item) => ({
      id: item.id,
      practice_id: item.practice_id,
      asked_by_user_id: item.asked_by.id,
      asked_by_name: item.asked_by.full_name,
      question_text: item.question_text,
      answer_text: item.answer_text,
      answered_by_user_id: item.answered_by?.id,
      answered_by_name: item.answered_by?.full_name,
      answered_at: item.answered_at,
      created_at: item.created_at,
    }));
  }

  /**
   * Ask a question
   */
  async askQuestion(practiceId: string, questionText: string): Promise<Question> {
    const data = await this.request<any>(`/questions/practice/${practiceId}`, {
      method: 'POST',
      body: JSON.stringify({ question_text: questionText }),
    });
    
    return {
      id: data.id,
      practice_id: data.practice_id,
      asked_by_user_id: data.asked_by.id,
      asked_by_name: data.asked_by.full_name,
      question_text: data.question_text,
      answer_text: data.answer_text,
      answered_by_user_id: data.answered_by?.id,
      answered_by_name: data.answered_by?.full_name,
      answered_at: data.answered_at,
      created_at: data.created_at,
    };
  }

  /**
   * Answer a question
   */
  async answerQuestion(questionId: string, answerText: string): Promise<Question> {
    const data = await this.request<any>(`/questions/answer/${questionId}`, {
      method: 'POST',
      body: JSON.stringify({ answer_text: answerText }),
    });
    
    return {
      id: data.id,
      practice_id: data.practice_id,
      asked_by_user_id: data.asked_by.id,
      asked_by_name: data.asked_by.full_name,
      question_text: data.question_text,
      answer_text: data.answer_text,
      answered_by_user_id: data.answered_by.id,
      answered_by_name: data.answered_by.full_name,
      answered_at: data.answered_at,
      created_at: data.created_at,
    };
  }

  /**
   * Delete a question
   */
  async deleteQuestion(questionId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/questions/${questionId}`, {
      method: 'DELETE',
    });
  }

  // ============= Leaderboard =============

  /**
   * Get current year leaderboard
   */
  async getLeaderboard(year?: number): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    const query = params.toString();
    const data = await this.request<any[]>(`/leaderboard${query ? '?' + query : ''}`);
    return data.map((item) => ({
      rank: item.rank,
      plant: typeof item.plant === 'string' ? item.plant : item.plant.name,
      total_points: item.total_points,
      origin_points: item.origin_points || 0,
      copier_points: item.copier_points || 0,
    }));
  }

  /**
   * Get plant leaderboard breakdown
   */
  async getPlantBreakdown(plantId: string, year?: number): Promise<PlantLeaderboardBreakdown> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    const query = params.toString();
    
    const response = await this.request<{
      plant: { id: string; name: string; short_name: string };
      year: number;
      total_points: number;
      origin_points: number;
      copier_points: number;
      breakdown: Array<{
        type: 'Origin' | 'Copier';
        points: number;
        date: string;
        bp_title: string;
      }>;
    }>(`/leaderboard/plant/${plantId}${query ? '?' + query : ''}`);

    // Separate breakdown into copied and originated
    const copied = response.breakdown
      .filter((item) => item.type === 'Copier')
      .map((item) => ({
        bp_title: item.bp_title,
        bp_id: '', // Backend doesn't return practice ID in breakdown
        points: item.points,
        date: item.date,
      }));

    // Group originated practices by bp_title to count copies
    const originatedMap = new Map<string, {
      bp_title: string;
      bp_id: string;
      copies_count: number;
      points: number;
    }>();

    response.breakdown
      .filter((item) => item.type === 'Origin')
      .forEach((item) => {
        const existing = originatedMap.get(item.bp_title);
        if (existing) {
          existing.copies_count += 1;
          existing.points += item.points;
        } else {
          originatedMap.set(item.bp_title, {
            bp_title: item.bp_title,
            bp_id: '', // Backend doesn't return practice ID in breakdown
            copies_count: 1,
            points: item.points,
          });
        }
      });

    const originated = Array.from(originatedMap.values());

    return {
      plant_id: response.plant.id,
      plant_name: response.plant.name,
      copied,
      copiedCount: copied.length,
      copiedPoints: response.copier_points,
      originated,
      originatedCount: originated.length,
      originatedPoints: response.origin_points,
    };
  }

  /**
   * Recalculate leaderboard (HQ only)
   */
  async recalculateLeaderboard(year?: number): Promise<APIResponse<{ message: string }>> {
    const response = await this.request<{ message: string }>('/leaderboard/recalculate', {
      method: 'POST',
      body: JSON.stringify({ year: year || new Date().getFullYear() }),
    });
    return {
      success: true,
      data: response,
    };
  }

  // ============= Analytics =============

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(currency: CurrencyFormat = 'lakhs'): Promise<DashboardOverview> {
    const data = await this.request<any>('/analytics/dashboard/overview', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Transform backend response to match frontend type
    return {
      monthly_count: data.this_month_practices || 0,
      ytd_count: data.ytd_practices || 0,
      monthly_savings: data.this_month_savings || '0',
      ytd_savings: data.total_savings || '0',
      stars: data.stars || 0,
      benchmarked_count: data.benchmarked_count || 0,
      currency: currency,
    };
  }

  /**
   * Get unified dashboard data (all data in one call)
   */
  async getUnifiedDashboard(plantId?: string, currency: 'lakhs' | 'crores' = 'lakhs'): Promise<any> {
    const params = new URLSearchParams();
    if (plantId) params.append('plant_id', plantId);
    params.append('currency', currency);
    
    const response = await this.request<{
      success: boolean;
      data: {
        overview: any;
        leaderboard: any[];
        copy_spread: any[];
        category_breakdown: any[];
        recent_benchmarked: any[];
        star_ratings?: any[];
        plant_performance?: any[];
        benchmark_stats?: any;
        recent_practices?: any[];
        my_practices?: any[];
        monthly_trend?: any[];
      };
    }>(`/analytics/dashboard/unified?${params.toString()}`, {
      method: 'GET',
    });

    // Transform backend response to match frontend type
    const { data } = response;
    
    return {
      success: true,
      data: {
        overview: {
          monthly_count: data.overview.this_month_practices || 0,
          ytd_count: data.overview.ytd_practices || 0,
          monthly_savings: data.overview.this_month_savings || '0',
          ytd_savings: data.overview.total_savings || '0',
          stars: data.overview.stars || 0,
          benchmarked_count: data.overview.benchmarked_count || 0,
          currency: currency as CurrencyFormat,
        },
        leaderboard: data.leaderboard || [],
        copy_spread: data.copy_spread || [],
        category_breakdown: (() => {
          const breakdown = data.category_breakdown || [];
          console.log('Raw category breakdown from backend:', breakdown);
          console.log('Breakdown type:', typeof breakdown, 'Is array:', Array.isArray(breakdown));
          
          if (!Array.isArray(breakdown)) {
            console.error('Category breakdown is not an array!', breakdown);
            return [];
          }
          
          const mapped = breakdown
            .filter((cat: any) => {
              const hasCategory = cat && (cat.category || cat.category_name || cat.name);
              if (!hasCategory) {
                console.warn('Filtered out category with no name:', cat);
              }
              return hasCategory;
            })
            .map((cat: any) => {
              const mappedCat = {
                category_id: cat.category_id || cat.id || '',
                category_name: cat.category || cat.category_name || cat.name || 'Unknown',
                category_slug: cat.category_slug || cat.slug || '',
                practice_count: cat.count || cat.practice_count || 0,
                color_class: cat.color_class || cat.colorClass || '',
                icon_name: cat.icon_name || cat.iconName || '',
              };
              console.log('Mapped category:', mappedCat);
              return mappedCat;
            });
          console.log('Final category breakdown:', mapped);
          console.log('Final category breakdown length:', mapped.length);
          return mapped;
        })(),
        recent_benchmarked: (data.recent_benchmarked || []).map((bp: any) => ({
          practice_id: bp.id || bp.practice_id || '',
          practice_title: bp.title || bp.practice_title || '',
          practice_category: bp.category || bp.practice_category || '',
          plant_name: bp.plant || bp.plant_name || '',
          benchmarked_date: bp.date ? formatRelativeTime(bp.date) : bp.benchmarked_date || '',
          benchmarked_date_iso: bp.date || bp.benchmarked_date_iso || '',
          savings_amount: bp.savings_amount || null,
          savings_currency: bp.savings_currency || 'lakhs',
          savings_period: bp.savings_period || 'annually',
        })),
        star_ratings: data.star_ratings || [],
        plant_performance: data.plant_performance || [],
        benchmark_stats: data.benchmark_stats || null,
        recent_practices: (data.recent_practices || []).map((practice: any) => ({
          id: practice.id || '',
          title: practice.title || '',
          category_name: practice.category || practice.category_name || '',
          plant_name: practice.plant || practice.plant_name || '',
          plant_short_name: practice.plant_short_name || '',
          submitted_by: practice.submitted_by || '',
          submitted_date: practice.submitted_date ? formatRelativeTime(practice.submitted_date) : '',
          submitted_date_iso: practice.submitted_date || '',
          savings_amount: practice.savings_amount || null,
          savings_currency: practice.savings_currency || 'lakhs',
          question_count: 0, // Will be populated if needed from practice details
        })),
        my_practices: data.my_practices || [],
        monthly_trend: data.monthly_trend || [],
      },
    };
  }

  /**
   * Get plant performance
   */
  async getPlantPerformance(
    period: PeriodType = 'yearly',
    year?: number,
    month?: number
  ): Promise<PlantPerformance[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const data = await this.request<any[]>('/analytics/plant-performance?' + params.toString());
    
    return data.map((item) => ({
      plant_id: item.plant.id,
      plant_name: item.plant.name,
      short_name: item.plant.short_name,
      submitted: item.practice_count || 0,
    }));
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(plantId?: string, year?: number): Promise<CategoryBreakdown[]> {
    const params = new URLSearchParams();
    if (plantId) params.append('plant_id', plantId);
    if (year) params.append('year', year.toString());

    const data = await this.request<any[]>('/analytics/category-breakdown?' + params.toString());
    
    return data
      .filter((item) => item.category) // Filter out items with null/undefined category
      .map((item) => ({
        category_id: '', // Backend doesn't return this, would need to fetch categories separately
        category_name: item.category || 'Unknown',
        category_slug: '',
        practice_count: item.practice_count || item.count || 0,
        color_class: '',
        icon_name: '',
      }));
  }

  /**
   * Get cost savings by plant
   */
  async getCostSavings(
    period: PeriodType = 'yearly',
    currency: CurrencyFormat = 'lakhs',
    year?: number,
    month?: number
  ): Promise<APIResponse<PlantSavings[]>> {
    const params = new URLSearchParams();
    params.append('period', period);
    params.append('currency', currency);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    return this.request<APIResponse<PlantSavings[]>>('/analytics/cost-savings?' + params.toString());
  }

  /**
   * Get cost analysis
   */
  async getCostAnalysis(currency: CurrencyFormat = 'lakhs'): Promise<APIResponse<PlantSavings[]>> {
    const params = new URLSearchParams();
    params.append('currency', currency);

    return this.request<APIResponse<PlantSavings[]>>('/analytics/cost-analysis?' + params.toString());
  }

  /**
   * Get monthly breakdown for a plant
   */
  async getPlantMonthlyBreakdown(
    plantId: string,
    year?: number,
    currency: CurrencyFormat = 'lakhs'
  ): Promise<MonthlySavingsBreakdown[]> {
    const params = new URLSearchParams();
    params.append('currency', currency);
    if (year) params.append('year', year.toString());

    return this.request<MonthlySavingsBreakdown[]>(
      `/analytics/plant-monthly-breakdown/${plantId}?${params.toString()}`
    );
  }

  /**
   * Get star ratings
   */
  async getStarRatings(currency: CurrencyFormat = 'lakhs', year?: number): Promise<StarRating[]> {
    const params = new URLSearchParams();
    params.append('currency', currency);
    if (year) params.append('year', year.toString());

    return this.request<StarRating[]>('/analytics/star-ratings?' + params.toString());
  }

  /**
   * Get monthly trend for a plant
   */
  async getPlantMonthlyTrend(
    plantId: string,
    year?: number,
    currency: CurrencyFormat = 'lakhs'
  ): Promise<MonthlyTrend[]> {
    const params = new URLSearchParams();
    params.append('currency', currency);
    if (year) params.append('year', year.toString());

    return this.request<MonthlyTrend[]>(
      `/analytics/plant-monthly-trend/${plantId}?${params.toString()}`
    );
  }

  /**
   * Get benchmark statistics
   */
  async getBenchmarkStats(year?: number, month?: number): Promise<BenchmarkStats[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    return this.request<BenchmarkStats[]>('/analytics/benchmark-stats?' + params.toString());
  }

  /**
   * Recalculate monthly savings (HQ only)
   */
  async recalculateSavings(year?: number): Promise<APIResponse<{ message: string }>> {
    return this.request<APIResponse<{ message: string }>>('/analytics/recalculate-savings', {
      method: 'POST',
      body: JSON.stringify({ year }),
    });
  }

  // ============= File Upload =============

  /**
   * Request presigned URL for file upload
   */
  async requestPresignedUrl(data: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    const response = await this.request<{
      presigned_url: string;
      blob_name: string;
      expires_in: number;
    }>('/uploads/presigned-url', {
      method: 'POST',
      body: JSON.stringify({
        file_name: data.filename,
        content_type: data.content_type,
        file_type: data.file_type,
      }),
    });

    return {
      upload_url: response.presigned_url,
      blob_name: response.blob_name,
      container: data.file_type === 'image' ? 'best-practices' : 'supporting-documents',
      expiry: new Date(Date.now() + response.expires_in * 1000).toISOString(),
    };
  }

  /**
   * Upload file to Azure Blob Storage
   */
  async uploadToAzure(presignedUrl: string, file: File): Promise<void> {
    await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'x-ms-blob-type': 'BlockBlob',
      },
    });
  }

  /**
   * Confirm image upload to backend
   */
  async confirmImageUpload(practiceId: string, imageData: {
    practice_id: string;
    image_type: 'before' | 'after';
    blob_container: string;
    blob_name: string;
    blob_url: string;
    file_size: number;
    content_type: string;
  }): Promise<PracticeImage> {
    return this.request<PracticeImage>(`/uploads/confirm-image/${practiceId}`, {
      method: 'POST',
      body: JSON.stringify({
        image_type: imageData.image_type,
        blob_name: imageData.blob_name,
        file_size: imageData.file_size,
        content_type: imageData.content_type,
      }),
    });
  }

  /**
   * Confirm document upload to backend
   */
  async confirmDocumentUpload(practiceId: string, documentData: {
    practice_id: string;
    document_name: string;
    blob_container: string;
    blob_name: string;
    blob_url: string;
    file_size: number;
    content_type: string;
  }): Promise<PracticeDocument> {
    return this.request<PracticeDocument>(`/uploads/confirm-document/${practiceId}`, {
      method: 'POST',
      body: JSON.stringify({
        document_name: documentData.document_name,
        blob_name: documentData.blob_name,
        file_size: documentData.file_size,
        content_type: documentData.content_type,
      }),
    });
  }

  /**
   * Complete document upload flow (request URL, upload, confirm)
   */
  async uploadPracticeDocument(
    practiceId: string,
    file: File
  ): Promise<PracticeDocument> {
    // Step 1: Request presigned URL
    const urlData = await this.requestPresignedUrl({
      practice_id: practiceId,
      file_type: 'document',
      filename: file.name,
      content_type: file.type,
      file_size: file.size,
    });

    // Step 2: Upload to Azure
    await this.uploadToAzure(urlData.upload_url, file);

    // Step 3: Confirm upload
    // Use URL for blob_url (remove SAS token)
    const blob_url = urlData.upload_url.split('?')[0];
    return this.confirmDocumentUpload(practiceId, {
      practice_id: practiceId,
      document_name: file.name,
      blob_container: urlData.container,
      blob_name: urlData.blob_name,
      blob_url: blob_url,
      file_size: file.size,
      content_type: file.type,
    });
  }

  /**
   * List practice images
   */
  async getPracticeImages(practiceId: string): Promise<PracticeImage[]> {
    return this.request<PracticeImage[]>(`/uploads/images/${practiceId}`);
  }

  /**
   * Delete practice image
   */
  async deletePracticeImage(practiceId: string, imageId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/uploads/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Complete file upload flow (request URL, upload, confirm)
   */
  async uploadPracticeImage(
    practiceId: string,
    file: File,
    imageType: 'before' | 'after'
  ): Promise<PracticeImage> {
    // Step 1: Request presigned URL
    const urlData = await this.requestPresignedUrl({
      practice_id: practiceId,
      file_type: 'image',
      image_type: imageType,
      filename: file.name,
      content_type: file.type,
      file_size: file.size,
    });

    // Step 2: Upload to Azure Blob Storage
    await this.uploadToAzure(urlData.upload_url, file);

    // Step 3: Confirm upload
    const blob_url = urlData.upload_url.split('?')[0];
    return this.confirmImageUpload(practiceId, {
      practice_id: practiceId,
      image_type: imageType,
      blob_container: urlData.container,
      blob_name: urlData.blob_name,
      blob_url: blob_url,
      file_size: file.size,
      content_type: file.type,
    });
  }

  /**
   * Get user's notifications
   */
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    is_read?: boolean;
  }): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) {
      const page = Math.floor((params.offset || 0) / params.limit) + 1;
      queryParams.append('page', page.toString());
      queryParams.append('page_size', params.limit.toString());
    }
    if (params?.is_read !== undefined) {
      queryParams.append('is_read', params.is_read.toString());
    }

    const response = await this.request<{
      items: any[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(`/notifications${queryParams.toString() ? '?' + queryParams.toString() : ''}`);

    return {
      success: true,
      data: response.items.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        type: item.type,
        title: item.title,
        message: item.message,
        related_practice_id: item.related_practice_id,
        related_question_id: item.related_question_id,
        practice_title: item.practice_title,
        is_read: item.is_read,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      pagination: {
        total: response.total,
        limit: response.page_size,
        offset: (response.page - 1) * response.page_size,
        has_more: response.page < response.total_pages,
      },
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(): Promise<UnreadCountResponse> {
    const response = await this.request<{ unread_count: number }>('/notifications/unread-count');
    return {
      unread_count: response.unread_count || 0,
    };
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const response = await this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    
    // Backend returns { id, read: true }, but we need full notification
    // Fetch the notification to get full details
    const notifications = await this.getNotifications({ limit: 100 });
    const notification = notifications.data.find(n => n.id === notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return {
      ...notification,
      is_read: true,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PATCH',
    });
  }
}

// Export singleton instance
export const apiService = new APIService();

// Export class for testing
export default APIService;

