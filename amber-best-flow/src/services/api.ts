/**
 * API Service Layer
 * Handles all communication with the FastAPI backend
 */

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
    try {
      // Ensure method is explicitly set and preserved (method must come after spreading options)
      const method = options.method || 'GET';
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
    const query = params.toString() ? `?${params}` : '';
    return this.request<Plant[]>(`/plants${query}`);
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
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString() ? `?${searchParams}` : '';
    return this.request<PaginatedResponse<BestPracticeListItem>>(`/best-practices${query}`);
  }

  /**
   * Get single best practice with full details
   */
  async getBestPractice(practiceId: string): Promise<BestPractice> {
    return this.request<BestPractice>(`/best-practices/${practiceId}`);
  }

  /**
   * Create new best practice
   */
  async createBestPractice(data: BestPracticeCreate): Promise<BestPractice> {
    return this.request<BestPractice>('/best-practices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update best practice
   */
  async updateBestPractice(practiceId: string, data: Partial<BestPracticeCreate>): Promise<BestPractice> {
    return this.request<BestPractice>(`/best-practices/${practiceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
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
    return this.request<BestPracticeListItem[]>('/best-practices/my-practices');
  }

  /**
   * Get recent best practices
   */
  async getRecentPractices(limit: number = 10): Promise<BestPracticeListItem[]> {
    return this.request<BestPracticeListItem[]>(`/best-practices/recent?limit=${limit}`);
  }

  // ============= Benchmarking =============

  /**
   * Benchmark a practice (HQ only)
   */
  async benchmarkPractice(practiceId: string): Promise<any> {
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
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString() ? `?${searchParams}` : '';
    return this.request<any[]>(`/benchmarking/list${query}`);
  }

  /**
   * Get recent benchmarked practices
   */
  async getRecentBenchmarkedPractices(limit: number = 10): Promise<any[]> {
    return this.request<any[]>(`/benchmarking/recent?limit=${limit}`);
  }

  /**
   * Get plants that copied a practice
   */
  async getPracticeCopies(practiceId: string): Promise<any[]> {
    return this.request<any[]>(`/benchmarking/${practiceId}/copies`);
  }

  /**
   * Get total benchmarked count
   */
  async getTotalBenchmarkedCount(): Promise<{ total_benchmarked: number }> {
    const result = await this.request<APIResponse<{ total_benchmarked: number }>>('/benchmarking/total-count');
    return result.data;
  }

  /**
   * Get copy spread (horizontal deployment status)
   */
  async getCopySpread(limit: number = 50): Promise<CopySpreadItem[]> {
    return this.request<CopySpreadItem[]>(`/benchmarking/copy-spread?limit=${limit}`);
  }

  // ============= Copy & Implement =============

  /**
   * Copy and implement a benchmarked practice
   */
  async copyAndImplement(data: CopyImplementRequest): Promise<CopyImplementResponse> {
    return this.request<CopyImplementResponse>('/copy/implement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get my implementations (copied practices)
   */
  async getMyImplementations(): Promise<any[]> {
    return this.request<any[]>('/copy/my-implementations');
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(limit: number = 50): Promise<APIResponse<CopySpreadItem[]>> {
    return this.request<APIResponse<CopySpreadItem[]>>(`/copy/deployment-status?limit=${limit}`);
  }

  // ============= Questions =============

  /**
   * Get questions for a practice
   */
  async getPracticeQuestions(practiceId: string): Promise<Question[]> {
    return this.request<Question[]>(`/questions/practice/${practiceId}`);
  }

  /**
   * Ask a question
   */
  async askQuestion(practiceId: string, questionText: string): Promise<Question> {
    return this.request<Question>(`/questions/practice/${practiceId}`, {
      method: 'POST',
      body: JSON.stringify({ question_text: questionText }),
    });
  }

  /**
   * Answer a question
   */
  async answerQuestion(questionId: string, answerText: string): Promise<Question> {
    const endpoint = `/questions/${questionId}/answer`;
    console.log('Answering question:', { questionId, endpoint, method: 'PATCH' });
    
    try {
      const result = await this.request<Question>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ answer_text: answerText }),
      });
      console.log('Answer question success:', result);
      return result;
    } catch (error) {
      console.error('Answer question error:', error);
      throw error;
    }
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
    const query = year ? `?year=${year}` : '';
    return this.request<LeaderboardEntry[]>(`/leaderboard/current${query}`);
  }

  /**
   * Get plant leaderboard breakdown
   */
  async getPlantBreakdown(plantId: string, year?: number): Promise<PlantLeaderboardBreakdown> {
    const query = year ? `?year=${year}` : '';
    return this.request<PlantLeaderboardBreakdown>(`/leaderboard/${plantId}/breakdown${query}`);
  }

  /**
   * Recalculate leaderboard (HQ only)
   */
  async recalculateLeaderboard(year?: number): Promise<APIResponse<any>> {
    const query = year ? `?year=${year}` : '';
    return this.request<APIResponse<any>>(`/leaderboard/recalculate${query}`, {
      method: 'POST',
    });
  }

  // ============= Analytics =============

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(currency: CurrencyFormat = 'lakhs'): Promise<DashboardOverview> {
    return this.request<DashboardOverview>(`/analytics/overview?currency=${currency}`);
  }

  /**
   * Get plant performance
   */
  async getPlantPerformance(
    period: PeriodType = 'yearly',
    year?: number,
    month?: number
  ): Promise<PlantPerformance[]> {
    const params = new URLSearchParams({ period });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    return this.request<PlantPerformance[]>(`/analytics/plant-performance?${params}`);
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(plantId?: string, year?: number): Promise<CategoryBreakdown[]> {
    const params = new URLSearchParams();
    if (plantId) params.append('plant_id', plantId);
    if (year) params.append('year', year.toString());
    const query = params.toString() ? `?${params}` : '';
    return this.request<CategoryBreakdown[]>(`/analytics/category-breakdown${query}`);
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
    const params = new URLSearchParams({ period, currency });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    return this.request<APIResponse<PlantSavings[]>>(`/analytics/cost-savings?${params}`);
  }

  /**
   * Get cost analysis
   */
  async getCostAnalysis(currency: CurrencyFormat = 'lakhs'): Promise<APIResponse<PlantSavings[]>> {
    return this.request<APIResponse<PlantSavings[]>>(`/analytics/cost-analysis?currency=${currency}`);
  }

  /**
   * Get monthly breakdown for a plant
   */
  async getPlantMonthlyBreakdown(
    plantId: string,
    year?: number,
    currency: CurrencyFormat = 'lakhs'
  ): Promise<MonthlySavingsBreakdown[]> {
    const params = new URLSearchParams({ currency });
    if (year) params.append('year', year.toString());
    return this.request<MonthlySavingsBreakdown[]>(`/analytics/cost-analysis/${plantId}/monthly?${params}`);
  }

  /**
   * Get star ratings
   */
  async getStarRatings(currency: CurrencyFormat = 'lakhs', year?: number): Promise<StarRating[]> {
    const params = new URLSearchParams({ currency });
    if (year) params.append('year', year.toString());
    return this.request<StarRating[]>(`/analytics/star-ratings?${params}`);
  }

  /**
   * Get monthly trend for a plant
   */
  async getPlantMonthlyTrend(
    plantId: string,
    year?: number,
    currency: CurrencyFormat = 'lakhs'
  ): Promise<MonthlyTrend[]> {
    const params = new URLSearchParams({ currency });
    if (year) params.append('year', year.toString());
    return this.request<MonthlyTrend[]>(`/analytics/star-ratings/${plantId}/monthly-trend?${params}`);
  }

  /**
   * Get benchmark statistics
   */
  async getBenchmarkStats(year?: number, month?: number): Promise<BenchmarkStats[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const query = params.toString() ? `?${params}` : '';
    return this.request<BenchmarkStats[]>(`/analytics/benchmark-stats${query}`);
  }

  /**
   * Recalculate monthly savings (HQ only)
   */
  async recalculateSavings(year?: number): Promise<APIResponse<any>> {
    const query = year ? `?year=${year}` : '';
    return this.request<APIResponse<any>>(`/analytics/recalculate-savings${query}`, {
      method: 'POST',
    });
  }

  // ============= File Upload =============

  /**
   * Request presigned URL for file upload
   */
  async requestPresignedUrl(data: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    return this.request<PresignedUrlResponse>('/best-practices/upload/presigned-url', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Sanitize and validate presigned URL
   * Fixes malformed URLs from backend that may contain "defaultendpointsprotocol=https//" prefix
   */
  private sanitizePresignedUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      throw new Error(`Invalid presigned URL: ${url}`);
    }

    let sanitized = url.trim();
    
    // Remove malformed prefix patterns
    // Pattern 1: https://defaultendpointsprotocol=https//...
    sanitized = sanitized.replace(/^https:\/\/defaultendpointsprotocol=https\/\//i, 'https://');
    
    // Pattern 2: defaultendpointsprotocol=https//... (missing https://)
    sanitized = sanitized.replace(/^defaultendpointsprotocol=https\/\//i, 'https://');
    
    // Pattern 3: Extract actual URL if embedded in malformed string
    const urlMatch = sanitized.match(/https?:\/\/[^\s"']+/i);
    if (urlMatch && !sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
      sanitized = urlMatch[0];
    }
    
    // Ensure URL starts with https:// or http://
    if (!sanitized.match(/^https?:\/\//i)) {
      // Try to find and extract a valid URL pattern
      const extractedUrl = sanitized.match(/(https?:\/\/[^\s"']+)/i);
      if (extractedUrl) {
        sanitized = extractedUrl[1];
      } else {
        // If no valid URL found, log and throw error
        console.error('Malformed presigned URL received:', url);
        throw new Error(`Invalid presigned URL format received from backend. Please check backend Azure Storage configuration. Original: ${url.substring(0, 100)}...`);
      }
    }
    
    // Validate URL format
    try {
      new URL(sanitized);
    } catch (e) {
      console.error('Invalid URL format after sanitization:', sanitized);
      throw new Error(`Invalid presigned URL format: ${sanitized.substring(0, 100)}...`);
    }
    
    return sanitized;
  }

  /**
   * Upload file to Azure Blob Storage
   */
  async uploadToAzure(presignedUrl: string, file: File): Promise<void> {
    // Sanitize the URL to fix malformed URLs from backend
    const sanitizedUrl = this.sanitizePresignedUrl(presignedUrl);
    
    console.log('Original URL:', presignedUrl.substring(0, 150));
    console.log('Sanitized URL:', sanitizedUrl.substring(0, 150));
    
    try {
      const response = await fetch(sanitizedUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type,
        },
        body: file,
        mode: 'cors', // Explicitly set CORS mode
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        const errorMessage = `Failed to upload file to Azure: ${response.status} ${response.statusText}`;
        console.error('Azure upload error:', errorMessage, errorText);
        throw new Error(`${errorMessage}. ${errorText.substring(0, 200)}`);
      }
    } catch (error: any) {
      // Provide more detailed error information
      if (error.message?.includes('CORS') || error.message?.includes('NetworkError') || error.name === 'TypeError') {
        const detailedError = `CORS/Network error: Unable to upload file to Azure Blob Storage. ` +
          `This may be due to: (1) Azure Storage CORS not configured for ${window.location.origin}, ` +
          `(2) Malformed presigned URL from backend, or (3) Network connectivity issues. ` +
          `Please check Azure Storage CORS settings and backend connection string configuration.`;
        console.error('Upload error details:', {
          originalUrl: presignedUrl.substring(0, 150),
          sanitizedUrl: sanitizedUrl.substring(0, 150),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          error: error.message
        });
        throw new Error(detailedError);
      }
      throw error;
    }
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
    return this.request<PracticeImage>(`/best-practices/${practiceId}/images`, {
      method: 'POST',
      body: JSON.stringify(imageData),
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
    return this.request<PracticeDocument>(`/best-practices/${practiceId}/documents`, {
      method: 'POST',
      body: JSON.stringify(documentData),
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

    // Sanitize the upload URL
    const sanitizedUploadUrl = this.sanitizePresignedUrl(urlData.upload_url);

    // Step 2: Upload to Azure
    await this.uploadToAzure(sanitizedUploadUrl, file);

    // Step 3: Confirm upload
    // Use sanitized URL for blob_url (remove SAS token)
    const blob_url = sanitizedUploadUrl.split('?')[0];
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
    return this.request<PracticeImage[]>(`/best-practices/${practiceId}/images`);
  }

  /**
   * Delete practice image
   */
  async deletePracticeImage(practiceId: string, imageId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/best-practices/${practiceId}/images/${imageId}`, {
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

    // Sanitize the upload URL
    const sanitizedUploadUrl = this.sanitizePresignedUrl(urlData.upload_url);

    // Step 2: Upload to Azure
    await this.uploadToAzure(sanitizedUploadUrl, file);

    // Step 3: Confirm upload
    // Use sanitized URL for blob_url (remove SAS token)
    const blob_url = sanitizedUploadUrl.split('?')[0];
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
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.is_read !== undefined) queryParams.append('is_read', params.is_read.toString());
    
    const query = queryParams.toString();
    return this.request<NotificationListResponse>(`/notifications${query ? `?${query}` : ''}`);
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(): Promise<UnreadCountResponse> {
    return this.request<UnreadCountResponse>('/notifications/unread-count');
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    return this.request<Notification>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
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

