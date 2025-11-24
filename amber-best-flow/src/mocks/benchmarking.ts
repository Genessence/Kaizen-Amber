import type { CopySpreadItem, CopyDetail } from '@/types/api';

export const mockBenchmarkedPractices = [
  {
    id: 'bench-001',
    practice_id: 'bp-001',
    practice_title: 'Smart Cart Movement & Management through AMR',
    practice_category: 'Automation',
    plant_name: 'Greater Noida (Ecotech 1)',
    benchmarked_date: '2025-01-20',
    copy_count: 3,
  },
  {
    id: 'bench-002',
    practice_id: 'bp-002',
    practice_title: 'Automated Quality Inspection System',
    practice_category: 'Quality',
    plant_name: 'Kanchipuram',
    benchmarked_date: '2025-01-18',
    copy_count: 2,
  },
  {
    id: 'bench-003',
    practice_id: 'bp-005',
    practice_title: 'Automated Safety Monitoring System',
    practice_category: 'Safety',
    plant_name: 'Supa',
    benchmarked_date: '2025-01-15',
    copy_count: 1,
  },
  {
    id: 'bench-004',
    practice_id: 'bp-007',
    practice_title: 'Predictive Maintenance System',
    practice_category: 'Productivity',
    plant_name: 'Ponneri',
    benchmarked_date: '2025-01-12',
    copy_count: 4,
  },
  {
    id: 'bench-005',
    practice_id: 'bp-009',
    practice_title: 'Automated Material Handling',
    practice_category: 'Automation',
    plant_name: 'Kanchipuram',
    benchmarked_date: '2025-01-10',
    copy_count: 2,
  },
];

export const mockCopySpread: CopySpreadItem[] = [
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
];


