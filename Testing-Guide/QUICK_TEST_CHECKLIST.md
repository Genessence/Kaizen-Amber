# Quick Testing Checklist
## Daily/Pre-Deployment Smoke Tests

**Time Required:** ~30 minutes  
**Purpose:** Verify core functionality before deployment

---

## 🚀 Quick Smoke Test (15 minutes)

### Authentication (2 min)
- [ ] Login as Plant User
- [ ] Login as HQ Admin
- [ ] Logout works
- [ ] Invalid credentials rejected

### Best Practice Submission (5 min)
- [ ] Create new practice
- [ ] Enter savings (integer only)
- [ ] Select currency (Lakhs/Crores)
- [ ] Upload before image
- [ ] Upload after image
- [ ] Submit successfully
- [ ] Dashboard updates immediately

### Dashboard Verification (3 min)
- [ ] Monthly count updated
- [ ] YTD count updated
- [ ] Savings amount correct
- [ ] Star rating displayed
- [ ] Recent practices list updated
- [ ] Charts render

### Analytics Check (3 min)
- [ ] Navigate to Analytics
- [ ] Charts load correctly
- [ ] Toggle Lakhs/Crores works
- [ ] Data matches dashboard
- [ ] No console errors

### Navigation (2 min)
- [ ] All main routes accessible
- [ ] Back button works
- [ ] Practice detail page loads
- [ ] Forms accessible

---

## 📊 Performance Check (5 minutes)

### Load Times
- [ ] Dashboard loads < 3s
- [ ] Analytics loads < 3s
- [ ] Form submission < 2s
- [ ] Image upload < 5s (5MB file)

### Console Check
- [ ] No errors in console
- [ ] No warnings (critical)
- [ ] Network requests succeed
- [ ] No 404s or 500s

---

## 🔢 Savings Calculation Spot Check (5 minutes)

### Test Cases
- [ ] Submit 10 Lakhs → Analytics shows 10L
- [ ] Submit 1 Crore → Analytics shows 100L (converted)
- [ ] Two practices same month → Sum correct
- [ ] Star rating matches criteria
- [ ] YTD accumulates correctly

---

## 📱 Mobile Quick Check (5 minutes)

### Responsive Design
- [ ] Dashboard readable on mobile
- [ ] Form submittable on mobile
- [ ] Charts visible on mobile
- [ ] Navigation works on mobile
- [ ] No horizontal scroll

---

## 🚨 Critical Path Test (Full Flow - 10 minutes)

### Plant User Journey
1. [ ] Login as Plant User
2. [ ] View dashboard (see current stats)
3. [ ] Click "Submit New Practice"
4. [ ] Fill all required fields:
   - [ ] Title
   - [ ] Description
   - [ ] Category
   - [ ] Problem Statement
   - [ ] Solution
   - [ ] Savings Amount (e.g., 50)
   - [ ] Currency (Lakhs)
5. [ ] Upload images (before/after)
6. [ ] Submit practice
7. [ ] Redirected to dashboard
8. [ ] Stats updated immediately:
   - [ ] Monthly count +1
   - [ ] Savings amount +50L
   - [ ] Practice in recent list
9. [ ] Navigate to Analytics
10. [ ] See practice reflected in charts
11. [ ] Logout

### HQ Admin Journey
1. [ ] Login as HQ Admin
2. [ ] View HQ dashboard
3. [ ] See all plants' data
4. [ ] Check star ratings table
5. [ ] Navigate to Practice Approvals
6. [ ] See recently submitted practice
7. [ ] Click to view details
8. [ ] Verify savings displayed
9. [ ] Benchmark the practice
10. [ ] Practice shows "Benchmarked" badge
11. [ ] Logout

---

## ⚠️ Edge Case Quick Tests (10 minutes)

### Input Validation
- [ ] Try decimal in savings (should reject)
- [ ] Try zero savings (should accept)
- [ ] Try very large number (should accept)
- [ ] Leave required field empty (should error)
- [ ] Try special characters in title (should sanitize)

### File Upload
- [ ] Upload 100KB image (fast)
- [ ] Upload 5MB image (progress shown)
- [ ] Try uploading PDF as image (rejected)
- [ ] Upload multiple documents

### Calculation Edge Cases
- [ ] Submit practice with 4L, 50L YTD → 1 star
- [ ] Submit practice with 16L, 200L YTD → 4 stars
- [ ] Submit practice with 17L, 201L YTD → 5 stars
- [ ] Verify boundaries correct

---

## 🐛 Common Issues Checklist

### If Dashboard Doesn't Update
- [ ] Check browser console for errors
- [ ] Verify network request succeeded
- [ ] Check cache invalidation happened
- [ ] Try hard refresh (Ctrl+Shift+R)
- [ ] Check backend logs

### If Savings Calculation Wrong
- [ ] Verify input amount
- [ ] Check currency conversion
- [ ] Verify period (should be monthly)
- [ ] Check database MonthlySavings table
- [ ] Run recalculation endpoint

### If Star Rating Incorrect
- [ ] Check both Monthly AND YTD values
- [ ] Verify against criteria table
- [ ] Ensure both thresholds met
- [ ] Check normalized values (lakhs)

### If Upload Fails
- [ ] Check file size (< 10MB for images)
- [ ] Verify file type allowed
- [ ] Check network connection
- [ ] Check server storage space
- [ ] Verify CORS settings

---

## 📋 Pre-Release Checklist

### Code Quality
- [ ] All tests passing
- [ ] No console errors
- [ ] No linter warnings (critical)
- [ ] Code reviewed
- [ ] Documentation updated

### Functionality
- [ ] All smoke tests pass
- [ ] Critical path works
- [ ] Edge cases handled
- [ ] Error messages clear
- [ ] Performance acceptable

### Data
- [ ] Database backed up
- [ ] Migration tested
- [ ] Seed data works
- [ ] Recalculation tested

### Deployment
- [ ] Environment variables set
- [ ] Build successful
- [ ] Static assets uploaded
- [ ] Health check passing
- [ ] Rollback plan ready

---

## 🔥 Post-Deployment Verification (5 minutes)

### Production Checks
- [ ] Site loads
- [ ] Login works
- [ ] Submit practice works
- [ ] Analytics display correctly
- [ ] No 500 errors
- [ ] SSL certificate valid
- [ ] No console errors
- [ ] Mobile works
- [ ] Performance acceptable

### Monitoring
- [ ] Check error logs
- [ ] Check performance metrics
- [ ] Verify API response times
- [ ] Check database CPU
- [ ] Monitor memory usage

---

## 📊 Performance Benchmarks

### Target Metrics
| Metric | Target | Measure |
|--------|--------|---------|
| Page Load | < 3s | DevTools Network |
| Form Submit | < 2s | Network tab |
| Chart Render | < 1s | Performance tab |
| Image Upload (5MB) | < 5s | Network tab |
| Analytics Calc | < 1s | Backend logs |

### How to Measure
1. Open DevTools (F12)
2. Go to Network tab
3. Hard refresh (Ctrl+Shift+R)
4. Check "DOMContentLoaded" time
5. Check "Load" time
6. Verify all requests < 2s

---

## 🎯 Daily Test Rotation

### Monday - Forms & Validation
- [ ] Test all form validations
- [ ] Test file uploads
- [ ] Test required fields
- [ ] Test integer-only savings

### Tuesday - Calculations & Analytics
- [ ] Test savings calculations
- [ ] Test star ratings
- [ ] Test YTD accumulation
- [ ] Test currency conversion

### Wednesday - Navigation & UX
- [ ] Test all routes
- [ ] Test back/forward buttons
- [ ] Test mobile responsiveness
- [ ] Test accessibility

### Thursday - Performance
- [ ] Test load times
- [ ] Test with large datasets
- [ ] Test concurrent users
- [ ] Test slow network

### Friday - Security & Edge Cases
- [ ] Test XSS attempts
- [ ] Test SQL injection
- [ ] Test auth edge cases
- [ ] Test boundary values

---

## 🚨 Emergency Hotfix Checklist

### Before Hotfix
- [ ] Identify root cause
- [ ] Create hotfix branch
- [ ] Write test for bug
- [ ] Fix bug
- [ ] Test fix locally

### Testing Hotfix
- [ ] Run affected smoke tests
- [ ] Verify bug fixed
- [ ] Check no new bugs introduced
- [ ] Test critical path still works
- [ ] Performance unchanged

### Deploy Hotfix
- [ ] Deploy to staging
- [ ] Full smoke test on staging
- [ ] Get approval
- [ ] Deploy to production
- [ ] Verify in production
- [ ] Monitor for 1 hour

---

## 📝 Test Result Template

```
Date: [YYYY-MM-DD]
Tester: [Name]
Build: [Version/Commit]
Environment: [Dev/Staging/Prod]

SMOKE TEST RESULTS:
✅ All Pass
⚠️ Some Issues
❌ Critical Failure

Details:
- Authentication: ✅
- Submission: ✅
- Dashboard: ⚠️ (minor delay)
- Analytics: ✅
- Navigation: ✅

Issues Found:
1. [Issue description]
2. [Issue description]

Performance:
- Dashboard load: 2.1s ✅
- Form submit: 1.5s ✅
- Analytics load: 2.8s ✅

Notes:
[Any additional observations]
```

---

## 💡 Quick Tips

### Faster Testing
- Use keyboard shortcuts (Tab, Enter, Esc)
- Keep DevTools open always
- Use multiple browser profiles
- Bookmark test URLs
- Save test data for quick input

### Common Keyboard Shortcuts
- `Ctrl+Shift+I` - Open DevTools
- `Ctrl+Shift+R` - Hard refresh
- `Ctrl+Shift+C` - Inspect element
- `F12` - Toggle DevTools
- `Ctrl+K` - Clear console

### Test Data to Keep Handy
```
Test Practice:
- Title: "Test Practice [Timestamp]"
- Description: "Test description for manual testing"
- Category: Quality
- Savings: 50 (Lakhs, Monthly)

Test Users:
- Plant: plant1@test.com / password123
- HQ: hq@test.com / password123
```

---

## 📞 Who to Contact

**Issues Found:**
- Critical bugs: @dev-team
- UI issues: @frontend-lead
- Calculation errors: @backend-lead
- Performance: @devops
- Security: @security-team

**Blocking Issues:**
- Can't login: STOP - Fix immediately
- Can't submit: STOP - Fix immediately
- Data loss: STOP - Investigate immediately
- Security breach: STOP - Escalate immediately

---

**Keep This Checklist Handy!**
Print or bookmark for quick reference during testing sessions.

