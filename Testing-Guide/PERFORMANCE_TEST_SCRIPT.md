# Performance Testing Script
## Automated & Manual Performance Tests

**Purpose:** Measure and benchmark system performance  
**Tools Required:** Chrome DevTools, Lighthouse, Network throttling

---

## 📊 Performance Metrics Baseline

### Target Performance Budgets

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| First Contentful Paint (FCP) | < 1.5s | < 2.5s | > 3s |
| Largest Contentful Paint (LCP) | < 2.5s | < 4s | > 5s |
| Time to Interactive (TTI) | < 3s | < 5s | > 7s |
| Total Blocking Time (TBT) | < 200ms | < 600ms | > 1000ms |
| Cumulative Layout Shift (CLS) | < 0.1 | < 0.25 | > 0.5 |
| API Response Time | < 500ms | < 1s | > 2s |
| Form Submission | < 2s | < 3s | > 5s |
| Image Upload (5MB) | < 5s | < 10s | > 15s |

---

## 🔬 Chrome DevTools Performance Test

### Test 1: Dashboard Load Performance

**Steps:**
1. Open Chrome in Incognito mode
2. Open DevTools (F12)
3. Go to "Performance" tab
4. Click "Record" (⏺️)
5. Navigate to dashboard
6. Wait for page to fully load
7. Click "Stop" (⏹️)
8. Analyze recording

**Measurements to Check:**
```
Look for:
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- Long Tasks (> 50ms)
- Script Evaluation Time
- Layout Shifts
```

**How to Read:**
1. Summary section shows:
   - Loading time
   - Scripting time
   - Rendering time
   - Painting time
2. Main thread flame chart shows:
   - Function call hierarchy
   - Long-running tasks
   - Idle time
3. Network timeline shows:
   - Request waterfall
   - Response times

**Red Flags:**
- ⚠️ Any task > 50ms
- ⚠️ Multiple layout recalculations
- ⚠️ Large script evaluation times
- ⚠️ Network requests > 2s

---

### Test 2: Form Submission Performance

**Steps:**
1. Open Performance tab
2. Start recording
3. Fill form completely
4. Click submit
5. Wait for navigation
6. Stop recording

**Measure:**
- Form validation time
- API call duration
- File upload time
- Navigation time
- Total time to dashboard

**Breakdown:**
```
Target Timeline:
- Validation: < 100ms
- API call: < 1.5s
- File upload: < 3s (if images)
- Cache invalidation: < 500ms
- Navigation: < 500ms
Total: < 5s (with images)
```

---

### Test 3: Analytics Rendering

**Steps:**
1. Clear cache
2. Start performance recording
3. Navigate to Analytics
4. Wait for all charts to render
5. Stop recording

**Measure:**
- API fetch time
- Data transformation time
- Chart rendering time
- Total render time

**Expected:**
```
- API fetch: < 800ms
- Transform data: < 200ms
- Render charts: < 1s
- Total: < 2s
```

---

## 📱 Lighthouse Performance Audit

### Running Lighthouse

**Steps:**
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Select:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
4. Select "Desktop" or "Mobile"
5. Click "Generate report"

**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

### Pages to Audit
1. Dashboard (/)
2. Analytics (/analytics)
3. Practice List (/practices)
4. Practice Detail (/practices/:id)
5. Submit Form (/submit-practice)

### Interpreting Results

**Performance Score Breakdown:**
- FCP (10%)
- Speed Index (10%)
- LCP (25%)
- TTI (10%)
- TBT (30%)
- CLS (15%)

**Common Issues & Fixes:**

**Issue:** Render-blocking resources
**Fix:** Defer non-critical CSS/JS

**Issue:** Large images
**Fix:** Optimize, compress, use WebP

**Issue:** Unused JavaScript
**Fix:** Code splitting, lazy loading

**Issue:** Long tasks
**Fix:** Break up long operations, use web workers

**Issue:** Layout shift
**Fix:** Set dimensions on images, reserve space

---

## 🌐 Network Performance Testing

### Test 1: Slow 3G Simulation

**Steps:**
1. Open DevTools Network tab
2. Click "No throttling" dropdown
3. Select "Slow 3G"
4. Navigate through app

**Test Actions:**
- Load dashboard
- Submit practice
- View analytics
- Upload image
- Navigate between pages

**Expected Behavior:**
- Loading indicators shown
- No timeouts (< 30s)
- Graceful degradation
- Retry mechanisms work
- User can still interact

**Measure:**
```
Dashboard load: < 10s
Form submit: < 15s
Image upload: < 30s
Analytics: < 10s
```

---

### Test 2: Network Interruption

**Steps:**
1. Start uploading large file
2. Open DevTools Network tab
3. Set to "Offline" midway
4. Observe error handling
5. Set back to "Online"
6. Check if retry works

**Expected:**
- Error message shown immediately
- Retry button available
- On reconnect, auto-retry OR manual retry
- No data loss
- Form state preserved

---

### Test 3: API Response Time Monitoring

**Manual Test:**
1. Open Network tab
2. Perform actions
3. Check each API call duration

**API Endpoints to Monitor:**

| Endpoint | Target | Max |
|----------|--------|-----|
| GET /best-practices | < 300ms | 1s |
| POST /best-practices | < 1s | 2s |
| GET /analytics/cost-savings | < 500ms | 1.5s |
| GET /analytics/star-ratings | < 400ms | 1s |
| POST /recalculate-savings | < 5s | 10s |
| GET /practice/:id | < 200ms | 500ms |

---

## 💾 Memory Performance

### Test 1: Memory Leak Detection

**Steps:**
1. Open DevTools Memory tab
2. Take heap snapshot (Snapshot 1)
3. Navigate through app (5 cycles):
   - Dashboard → Analytics → Form → Practice Detail → Dashboard
4. Force garbage collection (trash icon)
5. Take heap snapshot (Snapshot 2)
6. Compare snapshots

**Analysis:**
```
Snapshot 1: X MB
Snapshot 2: Y MB
Difference: (Y - X) MB

Acceptable: < 20% increase
Warning: 20-50% increase
Critical: > 50% increase
```

**Look for:**
- Detached DOM nodes (should be 0)
- Event listeners not cleaned up
- Large arrays/objects not released
- React components not unmounting

---

### Test 2: Allocation Timeline

**Steps:**
1. Memory tab → Allocation instrumentation on timeline
2. Click "Record"
3. Perform actions
4. Stop recording
5. Analyze allocation timeline

**Red Flags:**
- Continuous memory growth
- No garbage collection
- Large allocations that don't free
- Sawtooth pattern (good) vs. linear growth (bad)

---

## 🚀 Load Testing (Manual)

### Test 1: Concurrent Users

**Setup:**
Open 5 browser tabs (different profiles if possible)

**Scenario:**
All 5 users simultaneously:
1. Login
2. Navigate to form
3. Fill form
4. Submit (same time)
5. Check dashboard

**Measure:**
- All submissions succeed?
- Response times degraded?
- Errors encountered?
- Data consistency maintained?
- Final totals correct?

**Expected:**
- All succeed
- Response times < 2x normal
- No errors
- Data accurate

---

### Test 2: Large Dataset

**Setup:**
Seed database with:
- 100 plants
- 1000 practices
- 12 months of data

**Test:**
1. Login as HQ
2. Load dashboard
3. Load analytics
4. Load practice list
5. Search/filter

**Measure:**
- Dashboard load time
- Analytics render time
- List pagination performance
- Search responsiveness
- Chart performance

**Expected:**
- Dashboard: < 5s
- Analytics: < 5s
- List: < 3s per page
- Search: < 1s
- Charts: < 3s

---

## 📸 Bundle Size Analysis

### Analyze Production Build

**Steps:**
```bash
# Build production
npm run build

# Analyze bundle
npx source-map-explorer 'build/static/js/*.js'
```

**Target Sizes (gzipped):**
```
main.[hash].js: < 300KB
vendor.[hash].js: < 250KB
Route chunks: < 50KB each
Total: < 800KB
```

**Check for:**
- Large dependencies
- Duplicate code
- Unused imports
- Excessive vendor code

**Tools:**
- webpack-bundle-analyzer
- source-map-explorer
- bundlephobia.com

---

## 🎯 Real User Monitoring (RUM) Metrics

### Metrics to Track in Production

**Performance:**
```javascript
// Add to application
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  
  console.log('Page Load Metrics:');
  console.log('DNS Lookup:', perfData.domainLookupEnd - perfData.domainLookupStart);
  console.log('TCP Connection:', perfData.connectEnd - perfData.connectStart);
  console.log('Request:', perfData.responseStart - perfData.requestStart);
  console.log('Response:', perfData.responseEnd - perfData.responseStart);
  console.log('DOM Processing:', perfData.domComplete - perfData.domLoading);
  console.log('Total Load Time:', perfData.loadEventEnd - perfData.fetchStart);
});
```

**Core Web Vitals:**
```javascript
// Track LCP
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
}).observe({ entryTypes: ['largest-contentful-paint'] });

// Track FID
new PerformanceObserver((entryList) => {
  const firstInput = entryList.getEntries()[0];
  console.log('FID:', firstInput.processingStart - firstInput.startTime);
}).observe({ entryTypes: ['first-input'] });

// Track CLS
let clsScore = 0;
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    if (!entry.hadRecentInput) {
      clsScore += entry.value;
    }
  }
  console.log('CLS:', clsScore);
}).observe({ entryTypes: ['layout-shift'] });
```

---

## 🧪 Database Performance

### Query Performance Check

**Monitor These Queries:**

```sql
-- Check slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan < 10
ORDER BY idx_scan;
```

**Target:**
- All queries < 100ms
- Indexes used appropriately
- No table scans on large tables
- Connection pool efficient

---

## 📊 Performance Testing Report Template

```markdown
# Performance Test Report

**Date:** [YYYY-MM-DD]
**Tester:** [Name]
**Build:** [Version]
**Environment:** [Staging/Production]

## Executive Summary
Overall performance: ✅ Acceptable / ⚠️ Needs improvement / ❌ Critical

## Lighthouse Scores
- Dashboard: 95/100 ✅
- Analytics: 88/100 ⚠️
- Form: 92/100 ✅
- Practice Detail: 90/100 ✅

## Core Web Vitals
- FCP: 1.2s ✅
- LCP: 2.1s ✅
- TBT: 150ms ✅
- CLS: 0.05 ✅

## API Response Times
| Endpoint | Average | 95th % | Max |
|----------|---------|--------|-----|
| GET /practices | 250ms | 400ms | 800ms |
| POST /practices | 1.2s | 1.8s | 2.5s |
| GET /analytics | 450ms | 700ms | 1.2s |

## Page Load Times
| Page | Load Time | Target | Status |
|------|-----------|--------|--------|
| Dashboard | 2.1s | < 3s | ✅ |
| Analytics | 2.8s | < 3s | ✅ |
| Form | 1.5s | < 2s | ✅ |

## Issues Found
1. **Analytics page slow with large datasets**
   - Severity: Medium
   - Impact: Chart rendering takes 3.2s with 500+ practices
   - Recommendation: Implement pagination, lazy load charts

2. **Image upload slow on 3G**
   - Severity: Low
   - Impact: 5MB image takes 25s on Slow 3G
   - Recommendation: Compress images client-side, show progress

## Recommendations
1. Implement code splitting for Analytics page
2. Add image compression before upload
3. Optimize database queries (add index on submittedDate)
4. Enable Gzip compression on server
5. Implement service worker for offline support

## Performance Trends
- Dashboard load time: 2.5s → 2.1s (improved 16%)
- API response time: 400ms → 350ms (improved 12%)
- Bundle size: 850KB → 780KB (reduced 8%)

## Next Steps
- [ ] Address critical issues
- [ ] Optimize analytics queries
- [ ] Implement recommended changes
- [ ] Retest after optimizations
```

---

## 🎯 Performance Optimization Checklist

### Frontend Optimizations
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Image optimization (WebP, compression)
- [ ] Minimize bundle size
- [ ] Remove unused dependencies
- [ ] Use production builds
- [ ] Enable compression (Gzip/Brotli)
- [ ] Implement service worker
- [ ] Cache static assets
- [ ] Debounce search inputs

### Backend Optimizations
- [ ] Database indexes on frequent queries
- [ ] Query optimization (N+1 prevention)
- [ ] Response caching
- [ ] Compression enabled
- [ ] Connection pooling
- [ ] CDN for static assets
- [ ] Rate limiting
- [ ] Background jobs for heavy tasks

### Monitoring
- [ ] Set up performance monitoring
- [ ] Track Core Web Vitals
- [ ] Monitor API response times
- [ ] Set up alerts for degradation
- [ ] Track error rates
- [ ] Monitor server resources

---

**Run these tests regularly (weekly) and before major releases!**

