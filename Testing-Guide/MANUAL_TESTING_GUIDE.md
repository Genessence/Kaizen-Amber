# Manual Testing Guide - QuoteFlow Pro
## Comprehensive Edge Case and Performance Testing

**Version:** 1.0  
**Last Updated:** 2025-01-26  
**System:** Kaizen-Amber Best Practices Portal

---

## Table of Contents

1. [Performance Testing](#1-performance-testing)
2. [Form Validation & Input Edge Cases](#2-form-validation--input-edge-cases)
3. [File Upload & Download](#3-file-upload--download)
4. [Savings Calculation Edge Cases](#4-savings-calculation-edge-cases)
5. [Star Rating System](#5-star-rating-system)
6. [Navigation & Routing](#6-navigation--routing)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Dashboard & Analytics](#8-dashboard--analytics)
9. [Data Consistency](#9-data-consistency)
10. [Concurrent Operations](#10-concurrent-operations)
11. [Network Conditions](#11-network-conditions)
12. [Browser Compatibility](#12-browser-compatibility)
13. [Responsive Design](#13-responsive-design)
14. [Accessibility](#14-accessibility)
15. [Security Testing](#15-security-testing)

---

## 1. Performance Testing

### 1.1 Page Load Speed

#### Test Case 1.1.1: Initial Dashboard Load
**Priority:** HIGH  
**Steps:**
1. Clear browser cache
2. Open DevTools Network tab
3. Navigate to login page
4. Login as Plant User
5. Measure time to dashboard fully loaded

**Expected Results:**
- Login page loads in < 1 second
- Dashboard initial render < 2 seconds
- All data loaded and visible < 3 seconds
- No console errors

**Performance Metrics:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3s

**Edge Cases:**
- Test with slow 3G network
- Test with 10+ best practices loaded
- Test with large analytics dataset (year of data)

---

#### Test Case 1.1.2: Analytics Page Load
**Priority:** HIGH  
**Steps:**
1. Navigate to Analytics page
2. Measure initial load time
3. Toggle between different views (Yearly/Monthly)
4. Toggle currency (Lakhs/Crores)

**Expected Results:**
- Page renders in < 2 seconds
- Charts render smoothly without flicker
- Toggle operations complete in < 500ms
- No memory leaks on repeated toggles

**Performance Metrics:**
- Chart rendering: < 1s
- Data transformation: < 300ms
- Toggle response: < 500ms

---

#### Test Case 1.1.3: Practice List Loading
**Priority:** MEDIUM  
**Steps:**
1. Navigate to "Practice Approvals" page
2. Test with 0, 10, 50, 100+ practices
3. Measure load and scroll performance

**Expected Results:**
- List loads in < 2 seconds
- Smooth scrolling (60fps)
- Search filtering instant (< 100ms)
- Pagination works smoothly

**Edge Cases:**
- 500+ practices in database
- Very long practice titles (500+ chars)
- Practices with many images/documents

---

### 1.2 API Response Times

#### Test Case 1.2.1: Best Practice CRUD Operations
**Priority:** HIGH  
**Test Each:**
- Create practice: < 2s
- Read practice: < 500ms
- Update practice: < 1.5s
- Delete practice: < 1s

**Steps:**
1. Open DevTools Network tab
2. Perform each operation
3. Check response time in Network tab

**Expected Results:**
- All operations within time limits
- No timeout errors
- Proper error handling for failures

---

#### Test Case 1.2.2: Analytics Calculations
**Priority:** HIGH  
**Steps:**
1. Submit new practice with savings
2. Measure time until dashboard updates
3. Check analytics recalculation time
4. Verify MonthlySavings table updated

**Expected Results:**
- Savings calculation: < 1s
- Dashboard cache invalidation: < 500ms
- Fresh data visible: < 2s total
- Star rating updated correctly

**Edge Cases:**
- Submit during high load (multiple users)
- Submit with maximum savings amount
- Submit when database is under load

---

### 1.3 Memory & Resource Usage

#### Test Case 1.3.1: Memory Leaks
**Priority:** HIGH  
**Steps:**
1. Open DevTools Performance tab
2. Take heap snapshot
3. Navigate through all pages 5 times
4. Return to dashboard
5. Take another heap snapshot
6. Compare memory usage

**Expected Results:**
- Memory increase < 20% after 5 cycles
- No detached DOM nodes
- Event listeners properly cleaned up
- React Query cache bounded

**Tools:**
- Chrome DevTools Memory Profiler
- React DevTools Profiler

---

#### Test Case 1.3.2: Bundle Size
**Priority:** MEDIUM  
**Steps:**
1. Run production build
2. Check bundle sizes
3. Verify code splitting working

**Expected Results:**
- Main bundle: < 500KB (gzipped)
- Vendor bundle: < 300KB (gzipped)
- Route chunks: < 100KB each
- Lazy loading implemented

---

## 2. Form Validation & Input Edge Cases

### 2.1 Savings Amount Field

#### Test Case 2.1.1: Integer-Only Validation
**Priority:** HIGH  
**Test Inputs:**
- Valid: `0`, `1`, `100`, `999999`
- Invalid: `1.5`, `10.99`, `-5`, `abc`, `1e5`

**Steps:**
1. Open Best Practice form
2. Try entering each test input
3. Verify validation message

**Expected Results:**
- Only integers accepted
- Decimals rejected immediately
- Error message: "Only integer values are allowed"
- Form cannot submit with invalid input

---

#### Test Case 2.1.2: Boundary Values
**Priority:** HIGH  
**Test Inputs:**
- `0` - Zero savings
- `1` - Minimum positive
- `999999` - Large number
- `9999999999` - Very large number
- Empty string - Required field
- Spaces only - Invalid

**Expected Results:**
- Zero handled gracefully (0 stars)
- Very large numbers accepted
- Empty field shows required error
- Whitespace trimmed

---

#### Test Case 2.1.3: Copy-Paste Scenarios
**Priority:** MEDIUM  
**Test Inputs:**
- Copy from Excel: `123,456`
- Copy with currency: `₹50,000`
- Copy with decimals: `12.50`
- Copy with text: `50 lakhs`

**Expected Results:**
- Commas stripped automatically OR rejected
- Currency symbols rejected
- Decimals rejected
- Text rejected

---

### 2.2 Text Field Edge Cases

#### Test Case 2.2.1: Title Field
**Priority:** HIGH  
**Test Inputs:**
- 0 characters - Empty
- 1 character - Minimum
- 500 characters - Maximum
- Special chars: `<script>alert('xss')</script>`
- Emojis: `🚀 Best Practice 💰`
- Unicode: `مثال عربي`, `中文例子`

**Expected Results:**
- Required field validation
- Max length enforced (500 chars)
- XSS attempts sanitized
- Emojis/Unicode supported
- Display correctly in lists

---

#### Test Case 2.2.2: Description Field
**Priority:** HIGH  
**Test Inputs:**
- Very long text (5000+ chars)
- Multiple newlines
- HTML tags: `<b>Bold</b>`
- Markdown: `**Bold**`
- Code snippets with backticks

**Expected Results:**
- Textarea handles long text
- Newlines preserved
- HTML sanitized (not executed)
- Special formatting preserved
- Database stores correctly

---

#### Test Case 2.2.3: Problem Statement & Solution
**Priority:** MEDIUM  
**Test Scenarios:**
- Copy from Word (with formatting)
- Copy from PDF (with line breaks)
- Very technical content with symbols
- Multilingual content

**Expected Results:**
- Formatting stripped cleanly
- Content readable
- No encoding issues
- Saves and displays correctly

---

### 2.3 Category & Plant Selection

#### Test Case 2.3.1: Dropdown Edge Cases
**Priority:** MEDIUM  
**Test Scenarios:**
- Select then deselect
- Change selection multiple times
- Very long category names
- Categories with special characters

**Expected Results:**
- Selection persists
- Changes reflected immediately
- Long names truncated with ellipsis
- Special chars display correctly

---

### 2.4 Form State Management

#### Test Case 2.4.1: Draft Saving
**Priority:** HIGH  
**Steps:**
1. Fill form partially
2. Click "Save as Draft"
3. Navigate away
4. Return to form
5. Verify data persisted

**Expected Results:**
- All fields saved
- Savings data included
- Images/documents linked
- Can edit and re-save

**Edge Cases:**
- Save draft with no images
- Save draft with invalid data
- Multiple drafts per user
- Browser refresh during save

---

#### Test Case 2.4.2: Auto-Save Testing
**Priority:** MEDIUM  
**Steps:**
1. Fill form
2. Wait for auto-save (if implemented)
3. Close browser
4. Reopen and check

**Expected Results:**
- Data recovered
- No data loss
- Clear indication of auto-save status

---

## 3. File Upload & Download

### 3.1 Image Upload

#### Test Case 3.1.1: Image Types
**Priority:** HIGH  
**Test Files:**
- Valid: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Invalid: `.bmp`, `.tiff`, `.pdf`, `.doc`

**Steps:**
1. Click "Upload Before Image"
2. Select each file type
3. Verify acceptance/rejection

**Expected Results:**
- Valid types accepted
- Invalid types rejected
- Clear error message for invalid
- File type validation client-side

---

#### Test Case 3.1.2: Image Size
**Priority:** HIGH  
**Test Files:**
- 1KB - Very small
- 100KB - Small
- 5MB - Large
- 10MB+ - Very large

**Expected Results:**
- Small files upload quickly (< 1s)
- Large files show progress bar
- Max size enforced (e.g., 10MB)
- Error message if too large

**Performance:**
- 100KB image: < 1s
- 5MB image: < 5s
- Progress indicator visible
- Upload cancellable

---

#### Test Case 3.1.3: Image Edge Cases
**Priority:** MEDIUM  
**Test Files:**
- Corrupted image file
- Renamed PDF as `.jpg`
- Image with EXIF orientation
- Animated GIF
- Transparent PNG
- SVG file (if allowed)

**Expected Results:**
- Corrupted files rejected
- Fake extensions detected
- EXIF handled correctly (auto-rotate)
- Animated GIFs supported
- Transparency preserved
- SVG sanitized if allowed

---

#### Test Case 3.1.4: Multiple Images
**Priority:** MEDIUM  
**Steps:**
1. Upload before image
2. Upload after image
3. Try uploading more than 2
4. Replace existing images

**Expected Results:**
- Before and after clearly labeled
- Cannot upload more than allowed
- Replace functionality works
- Preview updates immediately

---

### 3.2 Document Upload

#### Test Case 3.2.1: Document Types
**Priority:** HIGH  
**Test Files:**
- Valid: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`
- Invalid: `.exe`, `.bat`, `.sh`, `.zip`

**Expected Results:**
- Office formats accepted
- Executable files blocked
- Archive files rejected
- MIME type validation

---

#### Test Case 3.2.2: Document Size
**Priority:** HIGH  
**Test Files:**
- 10KB - Tiny
- 500KB - Small
- 5MB - Medium
- 20MB+ - Large

**Expected Results:**
- Size limit enforced (e.g., 20MB)
- Progress bar for large files
- Timeout handling (> 30s)
- Retry mechanism for failures

---

#### Test Case 3.2.3: Multiple Documents
**Priority:** MEDIUM  
**Steps:**
1. Upload up to maximum allowed
2. Try exceeding limit
3. Remove and re-upload

**Expected Results:**
- Max documents enforced
- Clear count indicator
- Delete works correctly
- Re-upload possible

---

### 3.3 Download Testing

#### Test Case 3.3.1: Download Documents
**Priority:** HIGH  
**Steps:**
1. Click download button
2. Verify file downloads
3. Open and verify content

**Expected Results:**
- Download starts immediately
- Correct filename
- File opens correctly
- No corruption

**Edge Cases:**
- Download multiple files quickly
- Download during poor network
- Download very large files
- Download with special char filenames

---

#### Test Case 3.3.2: Image Preview
**Priority:** MEDIUM  
**Steps:**
1. Click on before/after image
2. Verify opens in modal/new tab
3. Test zoom/pan if applicable

**Expected Results:**
- Image loads quickly
- Full resolution available
- Modal closes properly
- Navigation between images works

---

### 3.4 Upload Failure Scenarios

#### Test Case 3.4.1: Network Interruption
**Priority:** HIGH  
**Steps:**
1. Start uploading large file
2. Disable network mid-upload
3. Re-enable network

**Expected Results:**
- Error message shown
- Retry option available
- Partial upload cleaned up
- Form state preserved

---

#### Test Case 3.4.2: Server Error
**Priority:** HIGH  
**Steps:**
1. Simulate 500 server error
2. Simulate 413 Payload Too Large
3. Simulate 503 Service Unavailable

**Expected Results:**
- Clear error messages
- Retry functionality
- Form doesn't break
- User can continue

---

## 4. Savings Calculation Edge Cases

### 4.1 Amount Calculation

#### Test Case 4.1.1: Zero Savings
**Priority:** HIGH  
**Input:** 
- Savings Amount: `0`
- Currency: Lakhs
- Period: Monthly

**Expected Results:**
- Accepted by form
- Saves successfully
- Displays as `₹0 Lakhs`
- Shows 0 stars
- Included in analytics as 0

---

#### Test Case 4.1.2: Very Large Numbers
**Priority:** HIGH  
**Test Inputs:**
- `999999` Lakhs
- `99999` Crores
- `1000000` Lakhs (edge of practical range)

**Expected Results:**
- Accepted and saved
- Converted correctly
- Displays without overflow
- Calculations accurate
- Star rating handles (5 stars)

---

#### Test Case 4.1.3: Currency Conversion
**Priority:** HIGH  
**Test Scenarios:**

**Scenario 1: Lakhs to Analytics**
- Input: 50 Lakhs
- Expected in DB: 50.00
- Expected Display: ₹50 L
- Expected Crores Display: ₹0.50 Cr

**Scenario 2: Crores to Analytics**
- Input: 2 Crores
- Expected in DB: 200.00 (normalized to lakhs)
- Expected Display Lakhs: ₹200 L
- Expected Display Crores: ₹2 Cr

**Verify:**
- Conversion accurate
- No precision loss
- Display formatting correct
- Calculations use normalized value

---

#### Test Case 4.1.4: Rounding & Precision
**Priority:** MEDIUM  
**Test Scenarios:**
- 1 Cr = exactly 100 L
- 0.5 Cr = exactly 50 L
- 0.01 Cr = exactly 1 L
- 0.001 Cr = 0.1 L

**Expected Results:**
- No rounding errors
- Precise calculations
- Display shows 2 decimal places
- Database stores as Decimal

---

### 4.2 Period Handling

#### Test Case 4.2.1: Monthly Period
**Priority:** HIGH  
**Input:** 10 Lakhs Monthly

**Expected Results:**
- Stored as monthly
- Displayed as "Monthly"
- YTD calculates as sum of months
- Star rating uses monthly value

---

#### Test Case 4.2.2: Legacy Annual Data (if exists)
**Priority:** MEDIUM  
**Steps:**
1. If annual data exists in DB
2. Verify conversion to monthly
3. Check calculations

**Expected Results:**
- Annual ÷ 12 = Monthly
- Displays as Monthly
- Calculations correct
- No data loss

---

### 4.3 YTD Calculation

#### Test Case 4.3.1: Single Month
**Priority:** HIGH  
**Scenario:**
- Jan: 10L
- Feb-Dec: No data

**Expected Results:**
- Jan YTD: 10L
- Feb YTD: 10L (carry forward)
- Star rating: Jan=1★, Feb-Dec=1★

---

#### Test Case 4.3.2: Multiple Months
**Priority:** HIGH  
**Scenario:**
- Jan: 5L
- Feb: 5L
- Mar: 5L

**Expected Results:**
- Jan YTD: 5L
- Feb YTD: 10L
- Mar YTD: 15L
- Running total accurate

---

#### Test Case 4.3.3: Year Transition
**Priority:** HIGH  
**Scenario:**
- Dec 2024: 100L YTD
- Jan 2025: 10L

**Expected Results:**
- Jan 2025 YTD: 10L (reset)
- No carry over from previous year
- Separate year calculations
- Historical data preserved

---

#### Test Case 4.3.4: Mid-Year Start
**Priority:** MEDIUM  
**Scenario:**
- Plant created in June
- First practice in July

**Expected Results:**
- YTD starts from July
- No Jan-June data
- Calculations correct
- Star rating fair

---

### 4.4 Multiple Practices Same Month

#### Test Case 4.4.1: Sum Calculation
**Priority:** HIGH  
**Scenario:**
- Practice A: 5L
- Practice B: 5L
- Practice C: 5L
- All submitted in January

**Expected Results:**
- January total: 15L
- YTD: 15L
- Star rating based on total
- Each practice tracked individually

---

#### Test Case 4.4.2: Different Currencies
**Priority:** HIGH  
**Scenario:**
- Practice A: 50 Lakhs
- Practice B: 1 Crore
- Both in January

**Expected Results:**
- Normalized: 50L + 100L = 150L
- Display correct in both formats
- Calculations use normalized
- Individual displays use original

---

### 4.5 Recalculation Edge Cases

#### Test Case 4.5.1: Update Savings
**Priority:** HIGH  
**Steps:**
1. Practice with 10L savings
2. Update to 20L
3. Verify recalculation

**Expected Results:**
- Old value removed
- New value added
- YTD updated
- Star rating recalculated
- Dashboard refreshed

---

#### Test Case 4.5.2: Delete Practice
**Priority:** HIGH  
**Steps:**
1. Month has 30L total (3 practices × 10L)
2. Delete one practice (10L)
3. Verify recalculation

**Expected Results:**
- Total now 20L
- YTD adjusted
- Star rating updated
- Analytics reflect change

---

#### Test Case 4.5.3: Concurrent Updates
**Priority:** MEDIUM  
**Steps:**
1. Two users update different practices
2. Both in same month/plant
3. Verify both reflected

**Expected Results:**
- Both updates processed
- No race conditions
- Final total accurate
- No data loss

---

## 5. Star Rating System

### 5.1 Boundary Testing

#### Test Case 5.1.1: Exact Boundaries
**Priority:** HIGH  
**Test Each:**

| Monthly | YTD | Expected Stars |
|---------|-----|----------------|
| 4L | 50L | 1★ |
| 4.01L | 50.01L | 0★ (fails both) |
| 5L | 51L | 2★ |
| 8L | 100L | 2★ |
| 8.01L | 100.01L | 3★ |
| 12L | 150L | 3★ |
| 12.01L | 150.01L | 4★ |
| 16L | 200L | 4★ |
| 16.01L | 200.01L | 5★ |
| 20L | 250L | 5★ |

**Verify:**
- Boundaries inclusive/exclusive correct
- No overlap
- Consistent logic

---

#### Test Case 5.1.2: Mismatch Scenarios
**Priority:** HIGH  
**Test Cases:**

**High Monthly, Low YTD:**
- Monthly: 20L, YTD: 30L
- Expected: 1★ (YTD limits)

**Low Monthly, High YTD:**
- Monthly: 2L, YTD: 300L
- Expected: 0★ (monthly limits)

**One Threshold Met:**
- Monthly: 20L, YTD: 60L
- Expected: 2★ (both must meet)

**Verify:**
- Both thresholds required
- Lower threshold determines rating
- Logic consistent

---

### 5.2 Display Testing

#### Test Case 5.2.1: Star Icons
**Priority:** MEDIUM  
**Steps:**
1. View HQ Dashboard star table
2. Check each star level (0-5)
3. Verify visual consistency

**Expected Results:**
- Filled stars: yellow/gold color
- Empty stars: gray/muted
- 5 total stars always shown
- Aligned properly
- Clear visual hierarchy

---

#### Test Case 5.2.2: Info Dialog
**Priority:** MEDIUM  
**Steps:**
1. Click info icon (ℹ️)
2. Verify dialog opens
3. Check criteria table
4. Close dialog

**Expected Results:**
- Dialog opens smoothly
- Table displays all levels
- Examples clear
- Close button works
- Backdrop dismisses

---

### 5.3 Calculation Performance

#### Test Case 5.3.1: Bulk Recalculation
**Priority:** MEDIUM  
**Steps:**
1. Call recalculation endpoint
2. Measure time for 100 plants
3. Verify all updated

**Expected Results:**
- Completes in < 10s for 100 plants
- No timeouts
- All records updated
- No calculation errors

---

## 6. Navigation & Routing

### 6.1 Route Changes

#### Test Case 6.1.1: Direct URL Access
**Priority:** HIGH  
**Test URLs:**
- `/dashboard`
- `/analytics`
- `/practices/[invalid-id]`
- `/practices/[valid-id]`
- `/benchmark-bps`
- `/submit-practice`

**Expected Results:**
- Valid routes load correctly
- Invalid routes show 404
- Auth-protected routes redirect to login
- Role-based routes enforce permissions

---

#### Test Case 6.1.2: Browser Navigation
**Priority:** MEDIUM  
**Steps:**
1. Navigate: Dashboard → Analytics → Practice Detail
2. Click browser back button
3. Click browser forward button
4. Refresh page at each step

**Expected Results:**
- Back/forward work correctly
- State preserved appropriately
- No duplicate API calls
- Refresh doesn't break

---

#### Test Case 6.1.3: Deep Linking
**Priority:** MEDIUM  
**Test:**
- Share practice detail URL
- Open in new tab
- Bookmark and reopen

**Expected Results:**
- URL opens directly to practice
- Auth check happens
- Data loads correctly
- No redirect loops

---

### 6.2 Navigation State

#### Test Case 6.2.1: Form Navigation
**Priority:** HIGH  
**Steps:**
1. Fill form partially
2. Try to navigate away
3. Check for unsaved changes warning

**Expected Results:**
- Warning shown for unsaved changes
- Can cancel and stay
- Can discard and leave
- Data preserved if stayed

---

## 7. Authentication & Authorization

### 7.1 Login Scenarios

#### Test Case 7.1.1: Valid Login
**Priority:** HIGH  
**Test Cases:**
- Plant user credentials
- HQ user credentials
- Remember me checked
- Remember me unchecked

**Expected Results:**
- Successful login
- Redirect to dashboard
- Token stored correctly
- Session persists (if remember me)

---

#### Test Case 7.1.2: Invalid Login
**Priority:** HIGH  
**Test Cases:**
- Wrong password
- Non-existent email
- Empty fields
- SQL injection attempt
- XSS attempt

**Expected Results:**
- Clear error message
- No sensitive info leaked
- Account not locked (unless policy)
- Security attempts logged

---

#### Test Case 7.1.3: Session Timeout
**Priority:** MEDIUM  
**Steps:**
1. Login successfully
2. Wait for timeout period
3. Try to perform action

**Expected Results:**
- Session expires after timeout
- Redirect to login
- Message: "Session expired"
- Can login again

---

### 7.2 Authorization

#### Test Case 7.2.1: Role-Based Access
**Priority:** HIGH  
**Test Plant User:**
- ✅ Can view own dashboard
- ✅ Can submit practices
- ✅ Can view all practices
- ❌ Cannot access HQ dashboard
- ❌ Cannot benchmark practices
- ❌ Cannot view all plants analytics

**Test HQ User:**
- ✅ Can view HQ dashboard
- ✅ Can view all plant dashboards
- ✅ Can benchmark practices
- ✅ Can view company-wide analytics
- ❌ Cannot submit as plant user

---

#### Test Case 7.2.2: Practice Ownership
**Priority:** HIGH  
**Test:**
1. User A creates practice
2. User B (same plant) tries to edit
3. User C (different plant) tries to edit
4. HQ user tries to edit

**Expected Results:**
- Only owner can edit
- HQ can view all
- Clear permission errors
- No unauthorized access

---

### 7.3 Token Management

#### Test Case 7.3.1: Token Refresh
**Priority:** MEDIUM  
**Steps:**
1. Login and get access token
2. Wait until near expiry
3. Perform action
4. Check if token refreshed

**Expected Results:**
- Token refreshes automatically
- No interruption to user
- New token stored
- Old token invalidated

---

#### Test Case 7.3.2: Logout
**Priority:** HIGH  
**Steps:**
1. Login successfully
2. Perform some actions
3. Click logout
4. Try to access protected route

**Expected Results:**
- Token cleared
- Redirect to login
- Cannot access protected routes
- No residual session data

---

## 8. Dashboard & Analytics

### 8.1 Dashboard Cards

#### Test Case 8.1.1: Data Accuracy
**Priority:** HIGH  
**Verify Each Card:**
- Monthly Count: Matches DB
- YTD Count: Correct calculation
- Monthly Savings: Sum accurate
- YTD Savings: Cumulative accurate
- Star Rating: Matches criteria

**Steps:**
1. Submit practice
2. Verify dashboard updates
3. Check against database
4. Verify calculations

---

#### Test Case 8.1.2: Real-Time Updates
**Priority:** HIGH  
**Steps:**
1. Note current values
2. Submit new practice
3. Return to dashboard
4. Verify updated

**Expected Results:**
- Updates within 2 seconds
- No refresh needed
- All cards update
- Animations smooth

---

#### Test Case 8.1.3: Empty States
**Priority:** MEDIUM  
**Test:**
- New plant with no data
- Plant with only drafts
- Plant with zero savings

**Expected Results:**
- Empty state messages shown
- No errors
- Encouragement to submit
- Clear call to action

---

### 8.2 Charts

#### Test Case 8.2.1: Chart Rendering
**Priority:** HIGH  
**Test Charts:**
- Plant Performance (Bar)
- Cost Savings (Donut)
- Monthly Trend (Line)
- Category Breakdown (Pie)

**Expected Results:**
- Render without errors
- Data accurate
- Tooltips work
- Legend correct
- Colors consistent

---

#### Test Case 8.2.2: Chart Interactions
**Priority:** MEDIUM  
**Test:**
- Hover over bars/segments
- Click on legend items
- Toggle data series
- Resize window

**Expected Results:**
- Tooltips show correct data
- Legend toggles work
- Charts responsive
- Re-render smoothly

---

#### Test Case 8.2.3: Large Datasets
**Priority:** MEDIUM  
**Test:**
- 100+ practices
- 12 months of data
- 20+ plants

**Expected Results:**
- Charts remain performant
- Labels don't overlap
- Scrollable if needed
- No browser freeze

---

### 8.3 Toggle Controls

#### Test Case 8.3.1: Currency Toggle
**Priority:** HIGH  
**Steps:**
1. View analytics in Lakhs
2. Toggle to Crores
3. Toggle back to Lakhs

**Expected Results:**
- Instant update (< 500ms)
- All values converted
- No calculation errors
- Precision maintained
- State persists on refresh

---

#### Test Case 8.3.2: Period Toggle
**Priority:** HIGH  
**Steps:**
1. View yearly data
2. Toggle to monthly
3. Toggle to current month

**Expected Results:**
- Chart re-renders
- Data changes appropriately
- Labels update
- No errors

---

## 9. Data Consistency

### 9.1 Database Integrity

#### Test Case 9.1.1: Foreign Key Constraints
**Priority:** HIGH  
**Test:**
1. Delete plant with practices
2. Delete user with practices
3. Delete category with practices

**Expected Results:**
- Proper cascade or restrict
- Error messages clear
- No orphaned records
- Referential integrity maintained

---

#### Test Case 9.1.2: Data Validation
**Priority:** HIGH  
**Test:**
1. Insert invalid data via API
2. Check database rejects
3. Verify error handling

**Expected Results:**
- Schema validation enforced
- Type checking works
- Constraints respected
- Clear error messages

---

### 9.2 Cache Consistency

#### Test Case 9.2.1: Stale Data
**Priority:** HIGH  
**Steps:**
1. User A submits practice
2. User B views dashboard
3. Verify User B sees update

**Expected Results:**
- Cache invalidated globally
- All users see fresh data
- No stale data shown
- Automatic refresh

---

#### Test Case 9.2.2: Multiple Tabs
**Priority:** MEDIUM  
**Steps:**
1. Open app in two tabs
2. Perform action in tab 1
3. Check tab 2

**Expected Results:**
- Tab 2 eventually updates
- No conflicts
- Data consistent
- Clear which tab is active

---

## 10. Concurrent Operations

### 10.1 Multiple Users

#### Test Case 10.1.1: Simultaneous Submissions
**Priority:** HIGH  
**Steps:**
1. 5 users submit practices simultaneously
2. All to same plant
3. All in same month

**Expected Results:**
- All submissions succeed
- Savings calculated correctly
- No race conditions
- Final total accurate

---

#### Test Case 10.1.2: Edit Conflicts
**Priority:** MEDIUM  
**Steps:**
1. User A opens practice
2. User B opens same practice
3. User A saves changes
4. User B tries to save

**Expected Results:**
- Conflict detected
- Warning shown to User B
- Option to overwrite or cancel
- No data loss

---

## 11. Network Conditions

### 11.1 Slow Network

#### Test Case 11.1.1: 3G Simulation
**Priority:** HIGH  
**Steps:**
1. Open DevTools
2. Set network to "Slow 3G"
3. Navigate through app

**Expected Results:**
- Loading indicators shown
- No timeout errors
- Eventual success
- User can still interact

---

#### Test Case 11.1.2: Intermittent Connection
**Priority:** MEDIUM  
**Steps:**
1. Submit form
2. Disable network briefly
3. Re-enable network

**Expected Results:**
- Retry mechanism works
- Request completes
- User notified
- No data loss

---

### 11.2 Offline Mode

#### Test Case 11.2.1: Go Offline
**Priority:** MEDIUM  
**Steps:**
1. Load app
2. Disable network
3. Try to navigate

**Expected Results:**
- Clear offline message
- Cached pages still work
- Cannot submit forms
- Graceful degradation

---

## 12. Browser Compatibility

### 12.1 Desktop Browsers

#### Test Case 12.1.1: Cross-Browser Testing
**Priority:** HIGH  
**Test On:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Verify:**
- All features work
- Styling consistent
- No console errors
- Performance acceptable

---

### 12.2 Mobile Browsers

#### Test Case 12.2.1: Mobile Testing
**Priority:** HIGH  
**Test On:**
- Chrome Mobile (Android)
- Safari (iOS)
- Firefox Mobile
- Samsung Internet

**Verify:**
- Touch interactions work
- Forms submittable
- Charts visible
- Navigation easy

---

## 13. Responsive Design

### 13.1 Breakpoints

#### Test Case 13.1.1: Different Screen Sizes
**Priority:** HIGH  
**Test At:**
- 320px (Mobile S)
- 375px (Mobile M)
- 425px (Mobile L)
- 768px (Tablet)
- 1024px (Laptop)
- 1440px (Desktop)
- 2560px (4K)

**Verify:**
- No horizontal scroll
- Content readable
- Buttons accessible
- Charts scale
- Images responsive

---

### 13.2 Orientation

#### Test Case 13.2.1: Portrait/Landscape
**Priority:** MEDIUM  
**Steps:**
1. Open on tablet
2. Rotate to landscape
3. Rotate to portrait

**Expected Results:**
- Layout adapts
- No broken UI
- Content accessible
- Charts re-render

---

## 14. Accessibility

### 14.1 Keyboard Navigation

#### Test Case 14.1.1: Tab Navigation
**Priority:** HIGH  
**Steps:**
1. Use only Tab key
2. Navigate entire form
3. Submit using keyboard

**Expected Results:**
- Logical tab order
- Focus visible
- All controls accessible
- No keyboard traps

---

### 14.2 Screen Readers

#### Test Case 14.2.1: ARIA Labels
**Priority:** HIGH  
**Steps:**
1. Enable screen reader
2. Navigate dashboard
3. Fill form
4. Submit practice

**Expected Results:**
- All elements announced
- Form labels clear
- Error messages read
- Success messages read

---

### 14.3 Color Contrast

#### Test Case 14.3.1: WCAG Compliance
**Priority:** MEDIUM  
**Test:**
- Text on backgrounds
- Button states
- Links
- Error messages

**Expected Results:**
- Contrast ratio > 4.5:1
- Color not sole indicator
- Readable for colorblind users

---

## 15. Security Testing

### 15.1 Input Sanitization

#### Test Case 15.1.1: XSS Attempts
**Priority:** HIGH  
**Test Inputs:**
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
<iframe src="evil.com">
```

**Expected Results:**
- All sanitized
- No script execution
- Displayed as text
- No DOM manipulation

---

#### Test Case 15.1.2: SQL Injection
**Priority:** HIGH  
**Test Inputs:**
```sql
' OR '1'='1
'; DROP TABLE users;--
' UNION SELECT * FROM users--
```

**Expected Results:**
- Parameterized queries used
- No database errors
- Attempts logged
- No data exposed

---

### 15.2 CSRF Protection

#### Test Case 15.2.1: Cross-Site Requests
**Priority:** HIGH  
**Steps:**
1. Create malicious form on external site
2. Try to submit to your API
3. Verify rejection

**Expected Results:**
- CSRF token required
- External requests blocked
- SameSite cookies enforced

---

### 15.3 Authentication Security

#### Test Case 15.3.1: Password Security
**Priority:** HIGH  
**Test:**
- Password hashing
- Min/max length
- Complexity requirements
- Common password rejection

**Expected Results:**
- Passwords hashed (bcrypt/argon2)
- Policy enforced
- Common passwords blocked
- No plain text storage

---

### 15.4 File Upload Security

#### Test Case 15.4.1: Malicious Files
**Priority:** HIGH  
**Test Files:**
- `.exe` renamed to `.pdf`
- Shell scripts
- ZIP bombs
- Files with embedded scripts

**Expected Results:**
- MIME type verification
- File content checking
- Max size enforced
- Malicious files rejected

---

## Testing Checklist Summary

### Critical Path Tests (Do First)
- [ ] Login and authentication
- [ ] Submit best practice with savings
- [ ] Dashboard updates in real-time
- [ ] Analytics calculations accurate
- [ ] Star ratings correct
- [ ] File uploads work
- [ ] Navigation smooth

### High Priority Tests
- [ ] Form validation comprehensive
- [ ] Performance within limits
- [ ] Browser compatibility
- [ ] Mobile responsiveness
- [ ] Security measures effective
- [ ] Data consistency maintained

### Medium Priority Tests
- [ ] Edge case handling
- [ ] Error scenarios
- [ ] Accessibility compliance
- [ ] Concurrent operations
- [ ] Network resilience

### Nice to Have Tests
- [ ] Advanced interactions
- [ ] Aesthetic consistency
- [ ] Animation smoothness
- [ ] Tooltip accuracy
- [ ] Advanced security

---

## Bug Report Template

When you find an issue, use this template:

```markdown
### Bug Title
Brief description

**Severity:** Critical/High/Medium/Low

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
What should happen

**Actual Result:**
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Screen: 1920x1080
- User Role: Plant User

**Screenshots/Videos:**
[Attach here]

**Console Errors:**
```
[Paste console errors]
```

**Additional Context:**
Any other relevant information
```

---

## Test Execution Log

| Test Case | Status | Tester | Date | Notes |
|-----------|--------|--------|------|-------|
| 1.1.1 | ⏳ Pending | - | - | - |
| 1.1.2 | ⏳ Pending | - | - | - |
| ... | ... | ... | ... | ... |

**Legend:**
- ⏳ Pending
- ✅ Pass
- ❌ Fail
- ⚠️ Partial
- 🔄 Retest

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-26  
**Next Review:** After major feature additions

