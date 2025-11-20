# Frontend Integration Guide

Step-by-step guide to connect your existing React frontend (`amber-best-flow`) with the new FastAPI backend.

---

## 📋 Overview

Your frontend is currently using static data in components. This guide shows how to replace that with real API calls.

**Current**: Static data in TypeScript arrays  
**Target**: Dynamic data from PostgreSQL via REST API  

---

## Step 1: Create API Service Layer

Create `src/services/api.ts`:

```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class APIService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me: false }),
    });
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Best Practices
  async listBestPractices(filters: any = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request<any>(`/best-practices?${params}`);
  }

  async getBestPractice(id: string) {
    return this.request<any>(`/best-practices/${id}`);
  }

  async createBestPractice(data: any) {
    return this.request<any>('/best-practices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Benchmarking
  async benchmarkPractice(practiceId: string) {
    return this.request<any>(`/benchmarking/benchmark/${practiceId}`, {
      method: 'POST',
    });
  }

  async unbenchmarkPractice(practiceId: string) {
    return this.request<any>(`/benchmarking/unbenchmark/${practiceId}`, {
      method: 'DELETE',
    });
  }

  async listBenchmarkedPractices() {
    return this.request<any>('/benchmarking/list');
  }

  // Copy & Implement
  async copyAndImplement(originalPracticeId: string, data: any) {
    return this.request<any>('/copy/implement', {
      method: 'POST',
      body: JSON.stringify({
        original_practice_id: originalPracticeId,
        ...data,
      }),
    });
  }

  // Analytics
  async getDashboardOverview() {
    return this.request<any>('/analytics/overview');
  }

  async getPlantPerformance(period: 'yearly' | 'monthly', year?: number, month?: number) {
    const params = new URLSearchParams({ period });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    return this.request<any>(`/analytics/plant-performance?${params}`);
  }

  async getCategoryBreakdown() {
    return this.request<any>('/analytics/category-breakdown');
  }

  async getCostSavings(period: 'yearly' | 'monthly', currency: 'lakhs' | 'crores') {
    const params = new URLSearchParams({ period, currency });
    return this.request<any>(`/analytics/cost-savings?${params}`);
  }

  async getStarRatings(currency: 'lakhs' | 'crores' = 'lakhs') {
    return this.request<any>(`/analytics/star-ratings?currency=${currency}`);
  }

  // Leaderboard
  async getLeaderboard(year?: number) {
    const params = year ? `?year=${year}` : '';
    return this.request<any>(`/leaderboard/current${params}`);
  }

  async getPlantBreakdown(plantId: string) {
    return this.request<any>(`/leaderboard/${plantId}/breakdown`);
  }

  // Questions
  async getPracticeQuestions(practiceId: string) {
    return this.request<any>(`/questions/practice/${practiceId}`);
  }

  async askQuestion(practiceId: string, questionText: string) {
    return this.request<any>(`/questions/practice/${practiceId}`, {
      method: 'POST',
      body: JSON.stringify({ question_text: questionText }),
    });
  }

  async answerQuestion(questionId: string, answerText: string) {
    return this.request<any>(`/questions/${questionId}/answer`, {
      method: 'PATCH',
      body: JSON.stringify({ answer_text: answerText }),
    });
  }

  // File Upload
  async requestPresignedUrl(data: any) {
    return this.request<any>('/best-practices/upload/presigned-url', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadToAzure(presignedUrl: string, file: File) {
    await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type,
      },
      body: file,
    });
  }

  async confirmImageUpload(practiceId: string, imageData: any) {
    return this.request<any>(`/best-practices/${practiceId}/images`, {
      method: 'POST',
      body: JSON.stringify(imageData),
    });
  }
}

export const apiService = new APIService();
```

---

## Step 2: Update Environment Variables

Create/update `amber-best-flow/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Step 3: Update Login Component

Replace static login with API call in `LoginForm.tsx`:

```typescript
import { apiService } from '@/services/api';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const result = await apiService.login(email, password);
    
    // Get user info
    const userInfo = await apiService.getCurrentUser();
    
    // Update UI based on user role
    if (userInfo.role === 'hq') {
      onLogin('hq');
    } else {
      onLogin('plant');
    }
  } catch (error) {
    console.error('Login failed:', error);
    // Show error message to user
  }
};
```

---

## Step 4: Update Practice List

Replace static data in `PracticeList.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

const PracticeList = ({ userRole, onViewPractice, onBack }: PracticeListProps) => {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPractices();
  }, []);

  const loadPractices = async () => {
    try {
      setLoading(true);
      const result = await apiService.listBestPractices({
        limit: 100,
        offset: 0
      });
      setPractices(result.data);
    } catch (error) {
      console.error('Failed to load practices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rest of component...
};
```

---

## Step 5: Update Analytics

Replace static data in `Analytics.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

const Analytics = ({ userRole, onBack }: AnalyticsProps) => {
  const [plantStats, setPlantStats] = useState([]);
  const [costSavings, setCostSavings] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Load plant performance
      const performance = await apiService.getPlantPerformance('yearly');
      setPlantStats(performance);

      // Load cost savings
      const savings = await apiService.getCostSavings('yearly', 'lakhs');
      setCostSavings(savings.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Rest of component...
};
```

---

## Step 6: Implement File Upload

For image uploads in `BestPracticeForm.tsx`:

```typescript
const handleImageUpload = async (file: File, practiceId: string, imageType: 'before' | 'after') => {
  try {
    // Step 1: Request presigned URL
    const urlData = await apiService.requestPresignedUrl({
      practice_id: practiceId,
      file_type: 'image',
      image_type: imageType,
      filename: file.name,
      content_type: file.type,
      file_size: file.size,
    });

    // Step 2: Upload to Azure
    await apiService.uploadToAzure(urlData.upload_url, file);

    // Step 3: Confirm upload to backend
    await apiService.confirmImageUpload(practiceId, {
      practice_id: practiceId,
      image_type: imageType,
      blob_container: urlData.container,
      blob_name: urlData.blob_name,
      blob_url: urlData.upload_url.split('?')[0], // Remove SAS token
      file_size: file.size,
      content_type: file.type,
    });

    console.log('Image uploaded successfully');
  } catch (error) {
    console.error('Image upload failed:', error);
  }
};
```

---

## Step 7: Add Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const loadData = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const data = await apiService.someMethod();
    // Update state
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

// In JSX
{isLoading && <div>Loading...</div>}
{error && <div className="error">{error}</div>}
{!isLoading && !error && <YourComponent />}
```

---

## Step 8: Handle Authentication State

Create `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      } catch {
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    await apiService.login(email, password);
    await checkAuth();
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

## Step 9: Update Main App

Wrap your app with AuthProvider in `main.tsx`:

```typescript
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

---

## Step 10: Migration Checklist

### Components to Update

- [ ] `LoginForm.tsx` - Use apiService.login()
- [ ] `PracticeList.tsx` - Replace allPracticesData with API call
- [ ] `BestPracticeForm.tsx` - Submit to API, handle file uploads
- [ ] `Analytics.tsx` - Load data from analytics endpoints
- [ ] `HQAdminDashboard.tsx` - Load dashboard stats from API
- [ ] `PlantUserDashboard.tsx` - Load dashboard stats from API
- [ ] `BenchmarkedList.tsx` - Load from /benchmarking/list
- [ ] `ApprovalsList.tsx` - Load pending practices

### Data Flow Changes

**Before:**
```typescript
const allPractices = allPracticesData; // Static
```

**After:**
```typescript
const [practices, setPractices] = useState([]);

useEffect(() => {
  apiService.listBestPractices().then(result => {
    setPractices(result.data);
  });
}, []);
```

---

## Step 11: Handle Errors Gracefully

```typescript
import { toast } from 'sonner';

const handleAction = async () => {
  try {
    await apiService.someMethod();
    toast.success('Action completed successfully');
  } catch (error) {
    toast.error(error.message || 'Something went wrong');
  }
};
```

---

## Step 12: Implement Search & Filters

```typescript
const [filters, setFilters] = useState({
  search: '',
  category_id: undefined,
  plant_id: undefined,
  is_benchmarked: undefined,
});

const loadPractices = async () => {
  const result = await apiService.listBestPractices({
    ...filters,
    limit: 20,
    offset: 0,
  });
  setPractices(result.data);
};

// Call loadPractices() whenever filters change
useEffect(() => {
  loadPractices();
}, [filters]);
```

---

## Step 13: Implement Pagination

```typescript
const [pagination, setPagination] = useState({
  total: 0,
  limit: 20,
  offset: 0,
  has_more: false,
});

const loadMore = async () => {
  const result = await apiService.listBestPractices({
    limit: pagination.limit,
    offset: pagination.offset + pagination.limit,
  });
  
  setPractices([...practices, ...result.data]);
  setPagination(result.pagination);
};
```

---

## Step 14: Update Type Definitions

Create `src/types/api.ts`:

```typescript
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'plant' | 'hq';
  plant_id?: string;
  plant_name?: string;
  is_active: boolean;
}

export interface BestPractice {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name: string;
  plant_id: string;
  plant_name: string;
  problem_statement: string;
  solution: string;
  benefits?: string[];
  metrics?: string;
  implementation?: string;
  investment?: string;
  savings_amount?: number;
  savings_currency?: 'lakhs' | 'crores';
  submitted_date?: string;
  status: 'draft' | 'submitted' | 'approved' | 'revision_required';
  is_benchmarked: boolean;
  question_count: number;
  images: PracticeImage[];
  documents: PracticeDocument[];
}

export interface Plant {
  id: string;
  name: string;
  short_name: string;
  division: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color_class: string;
  icon_name: string;
}

// Add more types as needed...
```

---

## Step 15: Testing Integration

### Test Checklist

1. **Authentication**
   - [ ] Login with default credentials works
   - [ ] Token is stored in localStorage
   - [ ] Protected routes redirect to login when not authenticated
   - [ ] Logout clears tokens

2. **Best Practices**
   - [ ] List loads from API
   - [ ] Create new practice saves to database
   - [ ] Update practice works
   - [ ] Delete practice works
   - [ ] Filters work correctly
   - [ ] Search works

3. **Benchmarking**
   - [ ] HQ admin can benchmark practices
   - [ ] Benchmarked practices show badge
   - [ ] Plant users cannot benchmark

4. **Copy & Implement**
   - [ ] Copy button works
   - [ ] Points are awarded
   - [ ] Leaderboard updates

5. **Analytics**
   - [ ] Dashboard stats load correctly
   - [ ] Charts display real data
   - [ ] Currency toggle works
   - [ ] Star ratings calculate correctly

6. **File Upload**
   - [ ] Image upload to Azure works
   - [ ] Images display in practice details
   - [ ] Document upload works

---

## Common Issues & Solutions

### CORS Errors

If you see CORS errors in browser console:

1. Check backend CORS_ORIGINS in `.env`
2. Make sure your frontend URL is included
3. Restart backend after changing .env

### 401 Unauthorized

1. Check if token is being sent in Authorization header
2. Check if token has expired (login again)
3. Verify token in localStorage

### 404 Not Found

1. Check API_BASE_URL is correct
2. Verify backend is running
3. Check endpoint path matches

### Type Errors

TypeScript might complain about API responses:

```typescript
// Add proper typing
const result = await apiService.listBestPractices() as { data: BestPractice[] };
```

---

## Migration Strategy

### Phase 1: Core Features (Week 1)
- [ ] Authentication
- [ ] List best practices
- [ ] View practice details
- [ ] Basic dashboard stats

### Phase 2: Management (Week 2)
- [ ] Create/update practices
- [ ] File uploads
- [ ] Benchmarking
- [ ] Filters and search

### Phase 3: Advanced Features (Week 3)
- [ ] Copy & implement
- [ ] Leaderboard
- [ ] Analytics charts
- [ ] Q&A system

### Phase 4: Polish (Week 4)
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications
- [ ] Pagination
- [ ] Performance optimization

---

## Example: Complete Component Integration

**Before (Static Data):**
```typescript
export const allPracticesData: Practice[] = [
  { id: "BP-001", title: "...", ... },
  // ...
];

const PracticeList = () => {
  const practices = allPracticesData;
  return <div>{practices.map(p => ...)}</div>;
};
```

**After (API Integration):**
```typescript
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

const PracticeList = () => {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPractices();
  }, []);

  const loadPractices = async () => {
    try {
      setLoading(true);
      const result = await apiService.listBestPractices();
      setPractices(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{practices.map(p => ...)}</div>;
};
```

---

## 🎯 Success Criteria

Your integration is successful when:

✅ Users can login with database credentials  
✅ Dashboard shows real-time data from database  
✅ Creating a practice saves to PostgreSQL  
✅ Images upload to Azure Blob Storage  
✅ Benchmarking updates the database  
✅ Copy & Implement awards points  
✅ Leaderboard shows correct rankings  
✅ Analytics display real calculations  
✅ Star ratings update dynamically  

---

## 📚 Additional Resources

- **Backend API Docs**: http://localhost:8000/docs
- **API Guide**: `backend/API_GUIDE.md`
- **Setup Guide**: `backend/SETUP_GUIDE.md`
- **Quick Start**: `backend/QUICK_START.md`

---

**Ready to integrate!** 🚀  
**Estimated Integration Time**: 2-4 weeks  
**Start with**: Authentication and basic list operations

