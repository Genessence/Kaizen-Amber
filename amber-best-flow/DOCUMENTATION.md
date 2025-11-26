# Amber Best Practice & Benchmarking Portal - Documentation

## Table of Contents
1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [User Stories](#user-stories)
4. [Features](#features)
5. [Technical Architecture](#technical-architecture)
6. [User Flows](#user-flows)

---

## Overview

The **Amber Best Practice & Benchmarking Portal** is a comprehensive web application designed to facilitate the sharing, benchmarking, and cross-learning of best practices across multiple manufacturing plants within Amber Enterprises India Limited. The platform enables plant users to submit best practices, allows HQ administrators to review and benchmark them, and provides analytics to track performance and cost savings.

### Key Objectives
- **Knowledge Sharing**: Enable plants to share successful practices with each other
- **Benchmarking**: Allow HQ to identify and benchmark exceptional practices
- **Cross-Learning**: Facilitate the adoption of best practices across plants
- **Performance Tracking**: Monitor submissions, savings, and plant participation
- **Gamification**: Implement a points-based leaderboard system to encourage participation

---

## User Roles

### 1. Plant User
**Description**: Users from individual manufacturing plants who submit best practices and can copy/implement practices from other plants.

**Capabilities**:
- Submit new best practices
- View all best practices (company-wide)
- Copy and implement practices from other plants
- View personal dashboard with metrics
- Track benchmarked practices
- View analytics for their plant

### 2. HQ Admin
**Description**: Headquarters administrators who review and benchmark exceptional best practices across all plants.

**Capabilities**:
- Review submitted best practices from all plants
- Benchmark exceptional practices for company-wide visibility
- View company-wide analytics and metrics
- Monitor plant performance and star ratings
- Facilitate knowledge sharing across plants
- Track cost savings and star ratings
- Manage active/inactive plants

### System Design Philosophy

**Trust-Based Submission Model**

QuoteFlow Pro operates on a trust-based knowledge sharing model:

**Why No Approval Gate?**
- **Speed**: Best practices are shared immediately, not delayed by approval queues
- **Encouragement**: Plant users are empowered to share without fear of rejection
- **Agility**: Knowledge flows rapidly across the organization
- **Simplicity**: Fewer workflow steps mean easier adoption

**Quality Control Through Benchmarking**

Instead of approval gates, quality is indicated through:
- **Benchmarking**: HQ highlights exceptional practices
- **Star Ratings**: Automatic calculation based on savings impact
- **Copy Metrics**: Popular practices naturally rise through usage
- **Q&A System**: Community validates practices through questions

**Analytics Immediately Reflect Reality**

- Submitted practices count in plant analytics right away
- Savings calculations include all submitted practices
- Plant performance metrics update in real-time
- Star ratings calculated automatically based on monthly/YTD savings

This approach prioritizes **knowledge velocity** over **gatekeeping**, while still maintaining quality through visibility, metrics, and community engagement.

---

## User Stories

### Plant User Stories

#### US-001: Login and Authentication
**As a** Plant User  
**I want to** log in to the portal using my credentials  
**So that** I can access my plant's dashboard and submit best practices

**Acceptance Criteria**:
- User can access the login page
- User can enter email and password
- User can select "Remember me" option
- User is redirected to the Plant User Dashboard upon successful login
- User can see their plant name displayed in the header

---

#### US-002: Submit New Best Practice
**As a** Plant User  
**I want to** submit a new best practice with all relevant details  
**So that** it can be reviewed and potentially benchmarked by HQ

**Acceptance Criteria**:
- User can navigate to "Add Best Practice" page
- User can fill in required fields:
  - Practice Title
  - Category (Safety, Quality, Productivity, Cost, Digitalisation, ESG, Automation, Other)
  - Problem Statement
  - Solution Description
  - Benefits
  - Metrics
  - Implementation Details
  - Investment
  - Implementation Area
- User can upload before and after images
- User can upload supporting documents
- User can save as draft
- User can submit the practice
- User receives confirmation upon successful submission
- Practice appears in "Latest Best Practices" section

---

#### US-003: Copy and Implement Best Practice
**As a** Plant User  
**I want to** copy a benchmarked best practice from another plant  
**So that** I can implement it in my plant and earn points

**Acceptance Criteria**:
- User can view benchmarked practices in "Latest Benchmark BPs" section
- User can click "Copy & Implement" button on any benchmarked practice
- User sees a confirmation dialog explaining the points system:
  - Origin plant receives 10 points
  - Copier plant receives 5 points
- User can confirm the action
- Form is pre-filled with practice details
- User can modify details as needed
- User can submit the copied practice
- Points are automatically added to the leaderboard
- Practice appears in "Horizontal Deployment Status"

---

#### US-004: View Best Practices
**As a** Plant User  
**I want to** view all best practices submitted across the company  
**So that** I can learn from other plants and identify practices to implement

**Acceptance Criteria**:
- User can navigate to "View Best Practices" page
- User can see a list of all practices with:
  - Title
  - Category
  - Plant name
  - Submitted date
  - Benchmark status
- User can filter practices by:
  - Category
  - Plant
  - Date range
  - Benchmark status
- User can search practices by title or keywords
- User can click on any practice to view full details
- User can see before/after images
- User can see Q&A count if questions exist

---

#### US-005: View Practice Details
**As a** Plant User  
**I want to** view detailed information about a specific best practice  
**So that** I can understand the implementation and decide if I want to copy it

**Acceptance Criteria**:
- User can click on any practice to view details
- User can see:
  - Full problem statement
  - Complete solution description
  - Benefits list
  - Metrics and KPIs
  - Implementation details
  - Investment information
  - Before and after images
  - Submitted date and plant information
- User can see if the practice is benchmarked
- User can toggle benchmark status (if HQ admin)
- User can navigate back to the list
- User can copy and implement from detail page

---

#### US-006: View Dashboard Metrics
**As a** Plant User  
**I want to** view my plant's performance metrics on the dashboard  
**So that** I can track our progress and achievements

**Acceptance Criteria**:
- User can see "Monthly Progress (Uploaded BP's)" card showing:
  - Number of practices submitted this month
  - Clickable to view monthly breakdown
- User can see "YTD Summary" card showing:
  - Total practices submitted year-to-date
  - Clickable to view yearly breakdown
- User can see "Category Wise BP's" showing:
  - Count of practices per category
  - Color-coded categories
- User can see "Monthly Cost Savings & Stars" with:
  - Current month savings
  - YTD savings
  - Total stars earned
  - Interactive chart showing monthly trends
  - Toggle to switch between Lakhs (L) and Crores (Cr)
- User can see "Latest Benchmark BPs" section
- User can see "Latest Best Practices" section
- User can see "Benchmark BP Leaderboard" with rankings

---

#### US-007: View Monthly Progress Breakdown
**As a** Plant User  
**I want to** view a detailed breakdown of practices submitted each month  
**So that** I can track monthly performance

**Acceptance Criteria**:
- User can click on "Monthly Progress" card
- User sees a dialog with:
  - Month selector dropdown
  - Total practices count for selected month
  - Number of benchmarked practices
  - List of all practices for that month with:
    - Title
    - Category
    - Date
    - Benchmark status
- User can click on any practice to view details
- User can navigate through different months

---

#### US-008: View YTD Breakdown
**As a** Plant User  
**I want to** view all practices submitted year-to-date  
**So that** I can see our annual performance

**Acceptance Criteria**:
- User can click on "YTD Summary" card
- User sees a dialog with a table showing:
  - Practice title
  - Category
  - Submission date
  - Benchmark status
  - Q&A count
- Practices are sorted by date (newest first)

---

#### US-009: View Benchmark Leaderboard
**As a** Plant User  
**I want to** view the benchmark BP leaderboard  
**So that** I can see how my plant ranks compared to others

**Acceptance Criteria**:
- User can see a table with:
  - Serial Number
  - Plant name
  - Total points
  - Rank (with special badges for top 3)
  - Breakdown showing Origin/Copier points
- User can click on any plant row to see detailed breakdown:
  - BPs copied by this plant (with points and dates)
  - Benchmarked BPs originated by this plant (with copy counts and points)
- Points system:
  - Origin: 10 points per benchmarked BP
  - Copier: 5 points per copied BP

---

#### US-010: View Horizontal Deployment Status
**As a** Plant User  
**I want to** view which best practices have been horizontally deployed  
**So that** I can see the spread of successful practices

**Acceptance Criteria**:
- User can see a table showing:
  - BP Name
  - Origin Plant
  - Number of plants that copied it
- User can click on any row to see:
  - List of plants that copied the BP
  - Date when each plant copied it

---

#### US-011: View Benchmark Practices
**As a** Plant User  
**I want to** view all practices I have benchmarked  
**So that** I can track which practices I'm following

**Acceptance Criteria**:
- User can navigate to "Benchmark" page
- User can see a list of all benchmarked practices
- User can view details of each practice
- User can unbenchmark a practice
- User can copy and implement from this page

---

#### US-012: View Analytics
**As a** Plant User  
**I want to** view analytics for my plant  
**So that** I can understand our performance trends

**Acceptance Criteria**:
- User can navigate to "Analytics" page
- User can see "Yearly Analytics" chart showing:
  - Plant-wise BP submissions (only their plant)
- User can see "Yearly Cost Savings" with:
  - Toggle for Yearly/Monthly view
  - Toggle for Lakhs/Crores format
  - Chart showing savings over time
- User can see "Cost Analysis (Savings)" with:
  - Donut charts for current month and YTD
  - Plant-wise breakdown table
  - Clickable plant rows to see monthly breakdown
  - Toggle for Lakhs/Crores format

---

### HQ Admin Stories

#### US-013: Login and Authentication
**As an** HQ Admin  
**I want to** log in to the portal using my credentials  
**So that** I can access the admin dashboard and review practices

**Acceptance Criteria**:
- User can access the login page
- User can enter email and password
- User is redirected to the HQ Admin Dashboard upon successful login
- User can see "HQ Admin" badge in the header

---

#### US-014: Review and Benchmark Best Practices
**As an** HQ Admin  
**I want to** review submitted best practices  
**So that** I can benchmark exceptional ones for company-wide visibility

**Acceptance Criteria**:
- User can navigate to "Practice Approvals" page
- User can see list of submitted practices with:
  - Title
  - Category
  - Plant
  - Submitted date
  - Benchmarked status
  - Monthly savings information
- User can click on any practice to view full details
- User can benchmark a practice (marks it as exceptional)
- User can unbenchmark a practice if needed
- Benchmarked practices appear in "Latest Benchmark BPs" section
- User can see Q&A section if questions exist
- All submitted practices count in analytics immediately

**Technical Notes**:
- Practices with status 'submitted' are immediately included in analytics
- Benchmarking is a quality seal, not an approval gate
- Savings calculations include all submitted and approved practices

---

#### US-015: Benchmark Best Practices
**As an** HQ Admin  
**I want to** mark exceptional practices as benchmarked  
**So that** they become available for other plants to copy

**Acceptance Criteria**:
- User can toggle benchmark status on any practice
- When benchmarked, practice appears in "Latest Benchmark BPs" section
- Benchmark status is visible to all users
- Benchmarking triggers points calculation:
  - Origin plant receives 10 points
- User can see benchmarked practices count in dashboard

---

#### US-016: View Company-Wide Dashboard
**As an** HQ Admin  
**I want to** view company-wide metrics and performance  
**So that** I can monitor overall progress

**Acceptance Criteria**:
- User can see "Total Submissions" card showing:
  - Current month total
  - Year-to-date total
  - Percentage change vs last month
- User can see "Total Benchmarked BPs" card showing:
  - Total count
  - Clickable to view copy spread details
- User can see "Active Plants" card showing:
  - Active/Total plants ratio
  - Participation percentage
  - Clickable to view active/inactive plant list
- User can see "Category Wise BP's" showing company-wide counts
- User can see "Plant-wise Performance" chart with:
  - Toggle for Yearly/Current Month view
  - Bar chart showing submissions per plant
- User can see "Benchmark BPs - Current Month" chart
- User can see "Latest Benchmark BPs" section
- User can see "Latest Best Practices" section
- User can see "Star Ratings (Savings)" table
- User can see "Horizontal Deployment Status" table
- User can see "Benchmark BP Leaderboard"

---

#### US-017: View Active Plants Status
**As an** HQ Admin  
**I want to** view which plants are active and inactive  
**So that** I can track participation

**Acceptance Criteria**:
- User can click on "Active Plants" card
- User sees a dialog with:
  - Active Plants section showing:
    - Plant name
    - Number of submissions
    - Active badge
  - Inactive Plants section showing:
    - Plant name
    - 0 submissions
    - Inactive badge
- Plants are color-coded (green for active, red for inactive)

---

#### US-018: View Star Ratings
**As an** HQ Admin  
**I want to** view star ratings based on cost savings  
**So that** I can recognize top-performing plants

**Acceptance Criteria**:
- User can see a table with:
  - Plant name
  - Monthly Savings
  - YTD Savings
  - Stars (Month) rating
- User can toggle between Lakhs and Crores format
- User can click on any plant row to see:
  - Monthly breakdown of savings and stars
  - 12-month trend
- User can click info button to view star rating criteria
- Star calculation based on:
  - **Both monthly AND YTD thresholds must be met**
  - **5 stars**: YTD > 200L AND Monthly > 16L
  - **4 stars**: YTD ∈ (150, 200] AND Monthly ∈ (12, 16]
  - **3 stars**: YTD ∈ (100, 150] AND Monthly ∈ (8, 12]
  - **2 stars**: YTD ∈ (50, 100] AND Monthly ∈ (4, 8]
  - **1 star**: YTD ∈ (0, 50] AND Monthly ∈ (0, 4]
  - **0 stars**: YTD = 0 OR Monthly = 0
- **Examples**:
  - 16L monthly + 200L YTD = 4 stars (at upper boundary)
  - 17L monthly + 201L YTD = 5 stars (exceeds 4-star threshold)
  - 20L monthly + 60L YTD = 2 stars (limited by YTD)
  - 5L monthly + 30L YTD = 1 star (both in 1-star range)

---

#### US-019: View Cost Analysis
**As an** HQ Admin  
**I want to** view detailed cost savings analysis  
**So that** I can track financial impact

**Acceptance Criteria**:
- User can navigate to "Analytics" page
- User can see "Cost Analysis (Savings)" section with:
  - Donut charts for:
    - Current Month Savings (plant-wise breakdown)
    - YTD Savings (plant-wise breakdown)
  - Summary table showing:
    - Plant name
    - Last Month savings
    - Current Month savings
    - YTD Till Last Month
    - YTD Total
    - Percentage change
- User can toggle between Lakhs and Crores format
- User can click on any plant to see:
  - Monthly breakdown table
  - Best practices count per month
  - "View More" button for practices
  - Clicking "View More" opens a dialog showing:
    - All practices for that month
    - Practice title
    - Date added
    - Savings amount
    - Benchmark status
    - Clickable to view practice details

---

#### US-020: View Yearly Cost Savings
**As an** HQ Admin  
**I want to** view yearly cost savings trends  
**So that** I can analyze long-term impact

**Acceptance Criteria**:
- User can see "Yearly Cost Savings" section in Analytics
- User can toggle between:
  - Yearly/Monthly view
  - Lakhs/Crores format
- User can see a chart showing:
  - Plant-wise savings over time
  - Interactive tooltips with details
- User can see summary statistics

---

#### US-021: View Division Overview
**As an** HQ Admin  
**I want to** filter data by division  
**So that** I can focus on specific divisions

**Acceptance Criteria**:
- User can click "Active" button in header
- User sees division selector with:
  - "All" option
  - "Component" option
- User can see active/inactive plant counts
- User can see lists of active and inactive plants
- Data filters based on selected division

---

#### US-022: View Benchmark BP Leaderboard
**As an** HQ Admin  
**I want to** view the benchmark BP leaderboard  
**So that** I can see plant rankings

**Acceptance Criteria**:
- User can see a table identical to Plant User view with:
  - Serial Number
  - Plant name
  - Total points
  - Rank (with special badges for top 3)
  - Breakdown showing Origin/Copier points
- User can click on any plant row to see detailed breakdown
- User can toggle currency format (L/Cr)

---

## Features

### 1. Authentication & Authorization

#### Login System
- **Email/Password Authentication**: Secure login with email and password
- **Remember Me**: Option to stay logged in
- **Role-Based Access**: Different dashboards for Plant Users and HQ Admins
- **Session Management**: Automatic logout and session handling

#### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Glass Card Layout**: Modern glassmorphism design for login page
- **Branding**: Amber logo and company branding throughout

---

### 2. Dashboard Features

#### Plant User Dashboard
1. **Quick Actions**
   - Add Best Practice button
   - Plant name and portal title display

2. **Statistics Overview**
   - Monthly Progress (Uploaded BP's)
     - Current month count
     - Clickable to view monthly breakdown dialog
     - Month selector
     - Practice list with details
   - YTD Summary
     - Year-to-date total
     - Clickable to view yearly breakdown dialog
     - Table with all YTD practices

3. **Category Wise BP's**
   - Visual cards for each category:
     - Safety (Shield icon)
     - Quality (CheckCircle icon)
     - Productivity (Zap icon)
     - Cost (IndianRupee icon)
     - Digitalisation (Cpu icon)
     - ESG (LineChart icon)
     - Automation (Bot icon)
     - Other (Settings icon)
   - Count display for each category

4. **Monthly Cost Savings & Stars**
   - Summary cards:
     - This Month Savings
     - YTD Savings
     - Total Stars ⭐
   - Interactive bar chart:
     - Monthly cost savings trend
     - Stars earned per month
     - Dual Y-axis (savings and stars)
   - Currency format toggle (L/Cr)
   - Tooltips with detailed information

5. **Latest Benchmark BPs**
   - List of recently benchmarked practices
   - Each item shows:
     - Title
     - Category badge
     - Plant name
     - Time since benchmarked
     - Expected savings
   - "View Details" button
   - "Copy & Implement" button
   - Hover effects for better UX

6. **Latest Best Practices**
   - List of most recent submissions from user's plant
   - Each item shows:
     - Title
     - Category
     - Submission date
     - Q&A count (if applicable)
   - Clickable to view details
   - Hover effects

7. **Benchmark BP Leaderboard**
   - Table with:
     - Serial Number
     - Plant name
     - Total Points
     - Rank (with special styling for top 3)
     - Breakdown preview
   - Clickable rows for detailed breakdown
   - Points system display

8. **Horizontal Deployment Status**
   - Table showing:
     - BP Name
     - Origin Plant
     - Number of plants that copied
   - Clickable rows to see copy details
   - Shows only BPs with images

#### HQ Admin Dashboard
1. **HQ Overview Header**
   - "Component Division Overview" title
   - "Active" button for division selector
   - Division filter (All/Component)

2. **Key Metrics**
   - Total Submissions
     - Current month total
     - YTD total
     - Percentage change indicator
   - Total Benchmarked BPs
     - Total count
     - Clickable to view copy spread
   - Active Plants
     - Active/Total ratio
     - Participation percentage
     - Clickable to view active/inactive list

3. **Category Wise BP's**
   - Company-wide category counts
   - Same visual design as Plant User view

4. **Plant-wise Performance**
   - Bar chart showing submissions per plant
   - Toggle for Yearly/Current Month view
   - Interactive tooltips
   - Plant name labels

5. **Benchmark BPs - Current Month**
   - Bar chart showing benchmarked BPs per plant
   - Total count badge
   - Interactive tooltips

6. **Latest Benchmark BPs**
   - Same as Plant User view
   - "Review" button instead of "Copy & Implement"

7. **Latest Best Practices**
   - Company-wide recent submissions
   - "Review" button for each practice

8. **Star Ratings (Savings)**
   - Table with:
     - Plant name
     - Monthly Savings
     - YTD Savings
     - Stars (Month) rating
   - Currency format toggle (L/Cr)
   - Clickable rows for monthly drilldown
   - Star calculation algorithm

9. **Horizontal Deployment Status**
   - Same as Plant User view

10. **Benchmark BP Leaderboard**
    - Same as Plant User view
    - Currency format toggle

11. **Active Plants Dialog**
    - Active Plants section:
      - Plant name
      - Submission count
      - Active badge (green)
    - Inactive Plants section:
      - Plant name
      - 0 submissions
      - Inactive badge (red)

---

### 3. Best Practice Management

#### Submit Best Practice
- **Form Fields**:
  - Practice Title (required)
  - Category selection (required)
  - Problem Statement (required, textarea)
  - Solution Description (required, textarea)
  - Benefits (textarea)
  - Metrics (textarea)
  - Implementation Details (textarea)
  - Investment (textarea)
  - Implementation Area (select)
- **File Uploads**:
  - Before Image (optional)
  - After Image (optional)
  - Supporting Documents (multiple, optional)
- **Actions**:
  - Save as Draft
  - Submit for Review
- **Copy & Implement Mode**:
  - Pre-filled form from benchmarked practice
  - Can modify details
  - Tracks origin plant for points

#### View Best Practices
- **List View**:
  - Search functionality
  - Filter by:
    - Category
    - Plant
    - Date range
    - Benchmark status
  - Sort options
  - Pagination (if needed)
- **Practice Cards**:
  - Title
  - Category badge
  - Plant name
  - Submission date
  - Benchmark status badge
  - Q&A count
  - Clickable to view details

#### Practice Details
- **Full Information Display**:
  - Title
  - Category
  - Plant name
  - Submitted by
  - Submission date
  - Problem Statement
  - Solution Description
  - Benefits list
  - Metrics
  - Implementation Details
  - Investment
  - Implementation Area
  - Before/After images (if available)
  - Supporting documents (if available)
- **Actions**:
  - Back to list
  - Toggle benchmark (HQ Admin only)
  - Copy & Implement (Plant User)
  - View Q&A (if exists)

---

### 4. Benchmarking System

#### Benchmark Status
- **Toggle Functionality**:
  - HQ Admin can mark practices as benchmarked
  - Visual indicator (badge) for benchmarked practices
  - Only benchmarked practices can be copied
- **Points System**:
  - Origin: 10 points when practice is benchmarked and copied
  - Copier: 5 points when copying a benchmarked practice
  - Automatic points calculation
  - Leaderboard updates in real-time

#### Benchmark List
- **Plant User View**:
  - List of all benchmarked practices
  - Can unbenchmark practices
  - Can copy and implement
  - Can view details

#### Benchmarking Workflow
- **HQ Admin Review**:
  - List of all submitted practices from all plants
  - Status indicators:
    - Draft (not yet submitted)
    - Submitted (visible to all, counts in analytics)
    - Approved (optional status for manual marking)
  - Benchmarking actions:
    - Benchmark practice (marks as exceptional)
    - Unbenchmark practice (remove benchmark status)
  - All submitted practices:
    - Count in plant savings and analytics immediately
    - Are visible to all plants for copying
    - Can be benchmarked at any time by HQ

**Trust-Based System**:
- Plant submissions are trusted upon submission
- No approval gate delays analytics or visibility
- Benchmarking serves as a quality seal for exceptional practices
- Encourages rapid knowledge sharing across organization

#### Practice Status Field

The `status` field exists in the database with these values:
- **`draft`**: Practice created but not submitted (not counted in analytics)
- **`submitted`**: Practice submitted by plant user (counts in analytics immediately)
- **`approved`**: Optional status for manual marking by HQ (currently unused in workflow)
- **`revision_required`**: Defined but not used in current trust-based system

**Current Workflow**:
```
draft → submitted → [can be benchmarked]
                 ↓
          (counts in analytics)
```

**Note**: The approval workflow mentioned in earlier documentation drafts was not implemented. The system operates on a trust-based model where submitted practices immediately count in analytics and are available for copying.

---

### 5. Analytics & Reporting

**Analytics Calculation Rules**:
- Practices with status `'submitted'` or `'approved'` are included in savings calculations
- Draft practices are excluded from analytics
- Savings are calculated and normalized to lakhs automatically
- Star ratings are calculated monthly based on both monthly and YTD thresholds
- MonthlySavings table is auto-updated when practices are created, updated, or deleted
- All calculations happen in real-time - no approval delays

#### Yearly Analytics
- **Bar Chart**:
  - Plant-wise BP submissions
  - Toggle for Yearly/Current Month (HQ Admin only)
  - Interactive tooltips
  - Plant name labels

#### Yearly Cost Savings
- **Chart Display**:
  - Plant-wise savings over time
  - Toggle for Yearly/Monthly view
  - Toggle for Lakhs/Crores format
  - Interactive tooltips
- **Summary Statistics**:
  - Total savings
  - Average per plant
  - Top performing plants

#### Cost Analysis (Savings)
- **Donut Charts**:
  - Current Month Savings (plant-wise breakdown)
  - YTD Savings (plant-wise breakdown)
  - Color-coded by plant
  - Percentage labels
- **Summary Table**:
  - Plant name
  - Last Month savings
  - Current Month savings
  - YTD Till Last Month
  - YTD Total
  - Percentage change (with color coding)
- **Plant Drilldown**:
  - Monthly breakdown table
  - Best practices count per month
  - "View More" button for each month
  - Practices detail dialog:
    - Practice title
    - Date added
    - Savings amount
    - Benchmark status
    - Clickable to view practice details
- **Currency Format Toggle**: Lakhs/Crores

---

### 6. Leaderboard & Gamification

#### Benchmark BP Leaderboard
- **Table Display**:
  - Serial Number
  - Plant name
  - Total Points
  - Rank (with special badges for #1, #2, #3)
  - Breakdown preview (showing first 2 entries)
- **Ranking Logic**:
  - Sorted by total points (descending)
  - Same points = same rank
  - Special styling for top 3 positions
- **Drilldown Dialog**:
  - BPs Copied by This Plant:
    - Count and total points
    - Detailed table with:
      - BP Title
      - Points
      - Date
  - Benchmarked BPs (Originated):
    - Count and total points
    - Detailed table with:
      - BP Title
      - Number of copies
      - Points

#### Points System
- **Origin Points**: 10 points per benchmarked BP that gets copied
- **Copier Points**: 5 points per benchmarked BP copied
- **Automatic Calculation**: Points updated when practices are copied
- **Leaderboard Updates**: Real-time updates when points are earned

---

### 7. Currency Formatting

#### Format Toggle
- **Available Formats**:
  - Lakhs (L) - Default
  - Crores (Cr)
- **Toggle Locations**:
  - Navigation bar (global)
  - Monthly Cost Savings & Stars (Plant User)
  - Star Ratings (HQ Admin)
  - Yearly Cost Savings (Analytics)
  - Cost Analysis (Analytics)
  - Benchmark BP Leaderboard (HQ Admin)

#### Formatting Rules
- **Lakhs Format**:
  - Values < 100L: 2 decimal places (truncated, not rounded)
  - Values >= 100L: 1 decimal place (truncated, not rounded)
- **Crores Format**:
  - Always 2 decimal places (truncated, not rounded)
- **No Rounding**: Exact values displayed (truncation only)

---

### 8. Search & Filter

#### Practice List Filters
- **Category Filter**: Dropdown to filter by category
- **Plant Filter**: Dropdown to filter by plant
- **Date Range Filter**: Select start and end dates
- **Benchmark Status Filter**: All/Benchmarked/Not Benchmarked
- **Search**: Text input to search by title or keywords

#### Search Functionality
- **Real-time Search**: Results update as user types
- **Case Insensitive**: Search works regardless of case
- **Keyword Matching**: Searches in title and description

---

### 9. Image & Document Management

#### Image Upload
- **Before Image**: Optional, single image
- **After Image**: Optional, single image
- **Preview**: Shows preview before upload
- **File Types**: JPG, PNG, JPEG
- **Size Limits**: Configurable

#### Document Upload
- **Supporting Documents**: Multiple files allowed
- **File Types**: PDF, DOC, DOCX, etc.
- **Download**: Users can download supporting documents

#### Image Display
- **Practice Details**: Shows before/after images side by side
- **Practice List**: Shows images if available
- **Responsive**: Images adapt to screen size

---

### 10. Q&A System

#### Question Management
- **Question Count**: Displayed on practice cards
- **Q&A Section**: Available in practice details
- **Question Submission**: Users can ask questions
- **Answer Submission**: Practice owners can answer

---

### 11. Responsive Design

#### Mobile Support
- **Responsive Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Large buttons and touch targets
- **Mobile Navigation**: Collapsible menu on mobile
- **Optimized Images**: Images scale appropriately

#### Desktop Features
- **Multi-Column Layouts**: Efficient use of screen space
- **Hover Effects**: Enhanced interactivity
- **Keyboard Navigation**: Full keyboard support

---

### 12. UI/UX Features

#### Visual Design
- **Color Scheme**: Consistent color palette
- **Icons**: Lucide React icons throughout
- **Typography**: Clear, readable fonts
- **Spacing**: Consistent padding and margins
- **Shadows**: Soft shadows for depth
- **Gradients**: Subtle gradients for visual appeal

#### Interactions
- **Hover Effects**: 
  - Cards lift on hover
  - Borders change color
  - Background color transitions
- **Click Feedback**: Visual feedback on clicks
- **Loading States**: Indicators for async operations
- **Error Handling**: User-friendly error messages
- **Success Messages**: Toast notifications for actions

#### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Screen reader support
- **Focus Indicators**: Clear focus states
- **Color Contrast**: WCAG compliant colors

---

## Technical Architecture

### Technology Stack
- **Frontend Framework**: React with TypeScript
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useMemo)
- **Routing**: Client-side routing (implicit)

### Component Structure
```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── Analytics.tsx    # Analytics page
│   ├── ApprovalsList.tsx # Submitted practices review and benchmarking
│   ├── BenchmarkedList.tsx # Benchmark list
│   ├── BestPracticeDetail.tsx # Practice details
│   ├── BestPracticeForm.tsx # Submit form
│   ├── HQAdminDashboard.tsx # HQ dashboard
│   ├── LoginForm.tsx   # Login component
│   ├── Navigation.tsx   # Navigation bar
│   ├── PlantUserDashboard.tsx # Plant dashboard
│   └── PracticeList.tsx # Practice list
├── lib/
│   └── utils.ts        # Utility functions (formatCurrency)
├── pages/
│   └── Index.tsx       # Main application entry
└── hooks/
    └── use-toast.ts    # Toast notifications
```

### Key Utilities
- **formatCurrency**: Formats numbers in Lakhs/Crores with truncation
- **cn**: Utility for merging Tailwind classes

### Data Flow
1. **State Management**: Component-level state with React hooks
2. **Data Passing**: Props drilling from Index.tsx to child components
3. **Practice Data**: Centralized in PracticeList.tsx (allPracticesData)
4. **Dynamic Updates**: State updates trigger re-renders

---

## User Flows

### Flow 1: Plant User Submits New Practice
1. User logs in → Plant User Dashboard
2. Clicks "Add Best Practice" button
3. Fills in form fields
4. Uploads before/after images (optional)
5. Uploads supporting documents (optional)
6. Clicks "Submit for Review"
7. Practice appears in "Latest Best Practices"
8. Practice status: Pending Review

### Flow 2: Plant User Copies Benchmark Practice
1. User views "Latest Benchmark BPs" on dashboard
2. Clicks "Copy & Implement" on a practice
3. Sees confirmation dialog explaining points
4. Confirms action
5. Form opens pre-filled with practice details
6. User can modify details
7. Submits the practice
8. Points automatically added:
   - Origin plant: +10 points
   - User's plant: +5 points
9. Practice appears in "Horizontal Deployment Status"

### Flow 3: HQ Admin Reviews and Benchmarks
1. Admin logs in → HQ Admin Dashboard
2. Navigates to "Practice Approvals" (review submitted practices)
3. Views list of submitted practices from all plants
4. Clicks on a practice to view full details
5. Reviews information (problem, solution, savings, images)
6. Clicks "Benchmark" to mark as exceptional
7. Practice appears in "Latest Benchmark BPs" section
8. Practice was already available for copying (immediately upon submission)
9. Benchmarked practices get highlighted visibility across all plants

### Flow 4: View Cost Analysis
1. User navigates to "Analytics" page
2. Views "Cost Analysis (Savings)" section
3. Sees donut charts and summary table
4. Clicks on a plant row
5. Sees monthly breakdown dialog
6. Clicks "View More" for a specific month
7. Sees list of practices for that month
8. Clicks on a practice to view full details

### Flow 5: View Leaderboard Details
1. User views "Benchmark BP Leaderboard" on dashboard
2. Clicks on a plant row
3. Sees breakdown dialog showing:
   - BPs copied by this plant
   - Benchmarked BPs originated by this plant
4. Can see detailed tables with dates and points

---

## Future Enhancements (Potential)

1. **Backend Integration**: Connect to real API endpoints
2. **User Management**: User profiles and settings
3. **Notifications**: Email/push notifications for updates
4. **Advanced Analytics**: More detailed reports and exports
5. **Comments System**: Enhanced Q&A with threading
6. **Version Control**: Track practice revisions
7. **Export Functionality**: Export reports to PDF/Excel
8. **Mobile App**: Native mobile applications
9. **Real-time Updates**: WebSocket integration for live updates
10. **Multi-language Support**: Internationalization

---

## Conclusion

The Amber Best Practice & Benchmarking Portal is a comprehensive platform designed to foster knowledge sharing, benchmarking, and cross-learning across manufacturing plants. With role-based access, comprehensive analytics, and a gamified leaderboard system, it encourages participation and tracks the impact of best practices on cost savings and operational efficiency.

The platform successfully combines functionality with an intuitive user interface, making it easy for both plant users and HQ administrators to navigate and utilize all features effectively.

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**Maintained By**: Development Team

