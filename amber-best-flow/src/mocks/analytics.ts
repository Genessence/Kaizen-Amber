import type {
  DashboardOverview,
  PlantPerformance,
  CategoryBreakdown,
  PlantSavings,
  MonthlySavingsBreakdown,
  StarRating,
  MonthlyTrend,
  BenchmarkStats,
} from '@/types/api';

export const mockDashboardOverview: DashboardOverview = {
  monthly_count: 5,
  ytd_count: 26,
  monthly_savings: '15.8',
  ytd_savings: '196.5',
  stars: 4,
  benchmarked_count: 4,
  currency: 'lakhs',
};

export const mockPlantPerformance: PlantPerformance[] = [
  {
    plant_id: 'plant-001',
    plant_name: 'Greater Noida (Ecotech 1)',
    short_name: 'GN-E1',
    submitted: 8,
  },
  {
    plant_id: 'plant-002',
    plant_name: 'Kanchipuram',
    short_name: 'KAN',
    submitted: 6,
  },
  {
    plant_id: 'plant-003',
    plant_name: 'Rajpura',
    short_name: 'RAJ',
    submitted: 4,
  },
  {
    plant_id: 'plant-004',
    plant_name: 'Shahjahanpur',
    short_name: 'SHA',
    submitted: 3,
  },
  {
    plant_id: 'plant-005',
    plant_name: 'Supa',
    short_name: 'SUP',
    submitted: 2,
  },
  {
    plant_id: 'plant-006',
    plant_name: 'Ranjangaon',
    short_name: 'RAN',
    submitted: 2,
  },
  {
    plant_id: 'plant-007',
    plant_name: 'Ponneri',
    short_name: 'PON',
    submitted: 1,
  },
];

export const mockCategoryBreakdown: CategoryBreakdown[] = [
  {
    category_id: 'cat-001',
    category_name: 'Safety',
    category_slug: 'safety',
    practice_count: 12,
    color_class: 'bg-red-50 text-red-700 border-red-200',
    icon_name: 'Shield',
  },
  {
    category_id: 'cat-002',
    category_name: 'Quality',
    category_slug: 'quality',
    practice_count: 15,
    color_class: 'bg-blue-50 text-blue-700 border-blue-200',
    icon_name: 'CheckCircle',
  },
  {
    category_id: 'cat-003',
    category_name: 'Productivity',
    category_slug: 'productivity',
    practice_count: 18,
    color_class: 'bg-purple-50 text-purple-700 border-purple-200',
    icon_name: 'TrendingUp',
  },
  {
    category_id: 'cat-004',
    category_name: 'Cost',
    category_slug: 'cost',
    practice_count: 22,
    color_class: 'bg-green-50 text-green-700 border-green-200',
    icon_name: 'IndianRupee',
  },
  {
    category_id: 'cat-005',
    category_name: 'Automation',
    category_slug: 'automation',
    practice_count: 14,
    color_class: 'bg-amber-50 text-amber-700 border-amber-200',
    icon_name: 'Bot',
  },
  {
    category_id: 'cat-006',
    category_name: 'Digitalisation',
    category_slug: 'digitalisation',
    practice_count: 10,
    color_class: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon_name: 'Cpu',
  },
  {
    category_id: 'cat-007',
    category_name: 'ESG',
    category_slug: 'esg',
    practice_count: 8,
    color_class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon_name: 'Leaf',
  },
  {
    category_id: 'cat-008',
    category_name: 'Other',
    category_slug: 'other',
    practice_count: 5,
    color_class: 'bg-gray-50 text-gray-700 border-gray-200',
    icon_name: 'FileText',
  },
];

export const mockPlantSavings: PlantSavings[] = [
  {
    plant_id: 'plant-001',
    plant_name: 'Greater Noida (Ecotech 1)',
    short_name: 'GN-E1',
    last_month: '8.5',
    current_month: '10.2',
    ytd_till_last_month: '85.3',
    ytd_total: '95.5',
    percent_change: 20.0,
  },
  {
    plant_id: 'plant-002',
    plant_name: 'Kanchipuram',
    short_name: 'KAN',
    last_month: '6.2',
    current_month: '7.8',
    ytd_till_last_month: '52.1',
    ytd_total: '59.9',
    percent_change: 25.8,
  },
  {
    plant_id: 'plant-003',
    plant_name: 'Rajpura',
    short_name: 'RAJ',
    last_month: '4.1',
    current_month: '5.5',
    ytd_till_last_month: '35.2',
    ytd_total: '40.7',
    percent_change: 34.1,
  },
  {
    plant_id: 'plant-004',
    plant_name: 'Shahjahanpur',
    short_name: 'SHA',
    last_month: '2.8',
    current_month: '3.2',
    ytd_till_last_month: '18.5',
    ytd_total: '21.7',
    percent_change: 14.3,
  },
  {
    plant_id: 'plant-005',
    plant_name: 'Supa',
    short_name: 'SUP',
    last_month: '1.5',
    current_month: '1.8',
    ytd_till_last_month: '12.3',
    ytd_total: '14.1',
    percent_change: 20.0,
  },
  {
    plant_id: 'plant-006',
    plant_name: 'Ranjangaon',
    short_name: 'RAN',
    last_month: '1.2',
    current_month: '1.5',
    ytd_till_last_month: '9.8',
    ytd_total: '11.3',
    percent_change: 25.0,
  },
  {
    plant_id: 'plant-007',
    plant_name: 'Ponneri',
    short_name: 'PON',
    last_month: '0.8',
    current_month: '1.0',
    ytd_till_last_month: '6.5',
    ytd_total: '7.5',
    percent_change: 25.0,
  },
];

export const mockStarRatings: StarRating[] = [
  {
    plant_id: 'plant-001',
    plant_name: 'Greater Noida (Ecotech 1)',
    monthly_savings: '10.2',
    ytd_savings: '95.5',
    stars: 5,
    currency: 'lakhs',
  },
  {
    plant_id: 'plant-002',
    plant_name: 'Kanchipuram',
    monthly_savings: '7.8',
    ytd_savings: '59.9',
    stars: 4,
    currency: 'lakhs',
  },
  {
    plant_id: 'plant-003',
    plant_name: 'Rajpura',
    monthly_savings: '5.5',
    ytd_savings: '40.7',
    stars: 3,
    currency: 'lakhs',
  },
  {
    plant_id: 'plant-004',
    plant_name: 'Shahjahanpur',
    monthly_savings: '3.2',
    ytd_savings: '21.7',
    stars: 2,
    currency: 'lakhs',
  },
  {
    plant_id: 'plant-005',
    plant_name: 'Supa',
    monthly_savings: '1.8',
    ytd_savings: '14.1',
    stars: 1,
    currency: 'lakhs',
  },
  {
    plant_id: 'plant-006',
    plant_name: 'Ranjangaon',
    monthly_savings: '1.5',
    ytd_savings: '11.3',
    stars: 1,
    currency: 'lakhs',
  },
  {
    plant_id: 'plant-007',
    plant_name: 'Ponneri',
    monthly_savings: '1.0',
    ytd_savings: '7.5',
    stars: 1,
    currency: 'lakhs',
  },
];

export const mockMonthlyTrend: MonthlyTrend[] = [
  { month: '2024-07', savings: '8.5', stars: 4 },
  { month: '2024-08', savings: '9.2', stars: 4 },
  { month: '2024-09', savings: '7.8', stars: 3 },
  { month: '2024-10', savings: '9.5', stars: 4 },
  { month: '2024-11', savings: '8.9', stars: 4 },
  { month: '2024-12', savings: '10.1', stars: 5 },
  { month: '2025-01', savings: '10.2', stars: 5 },
];

export const mockBenchmarkStats: BenchmarkStats[] = [
  {
    plant_id: 'plant-001',
    plant_name: 'Greater Noida (Ecotech 1)',
    benchmarked_count: 3,
  },
  {
    plant_id: 'plant-002',
    plant_name: 'Kanchipuram',
    benchmarked_count: 2,
  },
  {
    plant_id: 'plant-003',
    plant_name: 'Rajpura',
    benchmarked_count: 1,
  },
  {
    plant_id: 'plant-004',
    plant_name: 'Shahjahanpur',
    benchmarked_count: 1,
  },
  {
    plant_id: 'plant-005',
    plant_name: 'Supa',
    benchmarked_count: 1,
  },
  {
    plant_id: 'plant-006',
    plant_name: 'Ranjangaon',
    benchmarked_count: 0,
  },
  {
    plant_id: 'plant-007',
    plant_name: 'Ponneri',
    benchmarked_count: 1,
  },
];

export const mockUnifiedDashboard = {
  success: true,
  data: {
    overview: mockDashboardOverview,
    category_breakdown: mockCategoryBreakdown,
    leaderboard: [],
    recent_benchmarked: [
      {
        id: 'bench-001',
        practice_id: 'bp-001',
        practice_title: 'Smart Cart Movement & Management through AMR',
        practice_category: 'Automation',
        plant_name: 'Greater Noida (Ecotech 1)',
        benchmarked_date: '2025-01-20',
      },
      {
        id: 'bench-002',
        practice_id: 'bp-002',
        practice_title: 'Automated Quality Inspection System',
        practice_category: 'Quality',
        plant_name: 'Kanchipuram',
        benchmarked_date: '2025-01-18',
      },
      {
        id: 'bench-003',
        practice_id: 'bp-005',
        practice_title: 'Automated Safety Monitoring System',
        practice_category: 'Safety',
        plant_name: 'Supa',
        benchmarked_date: '2025-01-15',
      },
      {
        id: 'bench-004',
        practice_id: 'bp-007',
        practice_title: 'Predictive Maintenance System',
        practice_category: 'Productivity',
        plant_name: 'Ponneri',
        benchmarked_date: '2025-01-12',
      },
    ],
    copy_spread: [
      {
        bp_id: 'bp-001',
        bp_title: 'Smart Cart Movement & Management through AMR',
        origin_plant_id: 'plant-001',
        origin_plant_name: 'Greater Noida (Ecotech 1)',
        copy_count: 3,
        copies: [
          {
            plant_id: 'plant-002',
            plant_name: 'Kanchipuram',
            copied_date: '2025-01-25',
          },
          {
            plant_id: 'plant-003',
            plant_name: 'Rajpura',
            copied_date: '2025-01-28',
          },
          {
            plant_id: 'plant-004',
            plant_name: 'Shahjahanpur',
            copied_date: '2025-02-01',
          },
        ],
      },
      {
        bp_id: 'bp-007',
        bp_title: 'Predictive Maintenance System',
        origin_plant_id: 'plant-007',
        origin_plant_name: 'Ponneri',
        copy_count: 4,
        copies: [
          {
            plant_id: 'plant-001',
            plant_name: 'Greater Noida (Ecotech 1)',
            copied_date: '2025-01-20',
          },
          {
            plant_id: 'plant-002',
            plant_name: 'Kanchipuram',
            copied_date: '2025-01-22',
          },
          {
            plant_id: 'plant-003',
            plant_name: 'Rajpura',
            copied_date: '2025-01-25',
          },
          {
            plant_id: 'plant-005',
            plant_name: 'Supa',
            copied_date: '2025-01-30',
          },
        ],
      },
    ],
    my_practices: [],
  },
};


