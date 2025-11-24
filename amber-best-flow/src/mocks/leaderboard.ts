import type { LeaderboardEntry, PlantLeaderboardBreakdown } from '@/types/api';

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    plant_id: 'plant-001',
    plant_name: 'Greater Noida (Ecotech 1)',
    total_points: 85,
    origin_points: 50,
    copier_points: 35,
    rank: 1,
    breakdown: [
      {
        type: 'Origin',
        points: 10,
        date: '2025-01-20',
        bp_title: 'Smart Cart Movement & Management through AMR',
        bp_id: 'bp-001',
      },
      {
        type: 'Origin',
        points: 10,
        date: '2025-01-18',
        bp_title: 'Water Recycling System',
        bp_id: 'bp-008',
      },
      {
        type: 'Copier',
        points: 5,
        date: '2025-01-20',
        bp_title: 'Predictive Maintenance System',
        bp_id: 'bp-007',
      },
      {
        type: 'Copier',
        points: 5,
        date: '2025-01-15',
        bp_title: 'Automated Safety Monitoring System',
        bp_id: 'bp-005',
      },
    ],
  },
  {
    plant_id: 'plant-007',
    plant_name: 'Ponneri',
    total_points: 70,
    origin_points: 40,
    copier_points: 30,
    rank: 2,
    breakdown: [
      {
        type: 'Origin',
        points: 10,
        date: '2025-01-12',
        bp_title: 'Predictive Maintenance System',
        bp_id: 'bp-007',
      },
      {
        type: 'Copier',
        points: 5,
        date: '2025-01-25',
        bp_title: 'Smart Cart Movement & Management through AMR',
        bp_id: 'bp-001',
      },
    ],
  },
  {
    plant_id: 'plant-002',
    plant_name: 'Kanchipuram',
    total_points: 65,
    origin_points: 30,
    copier_points: 35,
    rank: 3,
    breakdown: [
      {
        type: 'Origin',
        points: 10,
        date: '2025-01-18',
        bp_title: 'Automated Quality Inspection System',
        bp_id: 'bp-002',
      },
      {
        type: 'Origin',
        points: 10,
        date: '2025-01-10',
        bp_title: 'Automated Material Handling',
        bp_id: 'bp-009',
      },
      {
        type: 'Copier',
        points: 5,
        date: '2025-01-25',
        bp_title: 'Smart Cart Movement & Management through AMR',
        bp_id: 'bp-001',
      },
    ],
  },
  {
    plant_id: 'plant-003',
    plant_name: 'Rajpura',
    total_points: 55,
    origin_points: 20,
    copier_points: 35,
    rank: 4,
    breakdown: [
      {
        type: 'Origin',
        points: 10,
        date: '2025-01-08',
        bp_title: 'Energy-Efficient LED Lighting System',
        bp_id: 'bp-003',
      },
      {
        type: 'Copier',
        points: 5,
        date: '2025-01-28',
        bp_title: 'Smart Cart Movement & Management through AMR',
        bp_id: 'bp-001',
      },
    ],
  },
  {
    plant_id: 'plant-005',
    plant_name: 'Supa',
    total_points: 45,
    origin_points: 10,
    copier_points: 35,
    rank: 5,
    breakdown: [
      {
        type: 'Origin',
        points: 10,
        date: '2025-01-05',
        bp_title: 'Automated Safety Monitoring System',
        bp_id: 'bp-005',
      },
      {
        type: 'Copier',
        points: 5,
        date: '2025-01-30',
        bp_title: 'Predictive Maintenance System',
        bp_id: 'bp-007',
      },
    ],
  },
  {
    plant_id: 'plant-004',
    plant_name: 'Shahjahanpur',
    total_points: 35,
    origin_points: 10,
    copier_points: 25,
    rank: 6,
    breakdown: [
      {
        type: 'Origin',
        points: 10,
        date: '2025-01-12',
        bp_title: 'Digital Production Dashboard',
        bp_id: 'bp-004',
      },
      {
        type: 'Copier',
        points: 5,
        date: '2025-02-01',
        bp_title: 'Smart Cart Movement & Management through AMR',
        bp_id: 'bp-001',
      },
    ],
  },
  {
    plant_id: 'plant-006',
    plant_name: 'Ranjangaon',
    total_points: 25,
    origin_points: 10,
    copier_points: 15,
    rank: 7,
    breakdown: [
      {
        type: 'Origin',
        points: 10,
        date: '2025-01-03',
        bp_title: 'Waste Reduction Through Lean Manufacturing',
        bp_id: 'bp-006',
      },
    ],
  },
];

export const mockPlantBreakdown: PlantLeaderboardBreakdown = {
  plant_id: 'plant-001',
  plant_name: 'Greater Noida (Ecotech 1)',
  copied: [
    {
      bp_title: 'Predictive Maintenance System',
      bp_id: 'bp-007',
      points: 5,
      date: '2025-01-20',
    },
    {
      bp_title: 'Automated Safety Monitoring System',
      bp_id: 'bp-005',
      points: 5,
      date: '2025-01-15',
    },
  ],
  copiedCount: 2,
  copiedPoints: 10,
  originated: [
    {
      bp_title: 'Smart Cart Movement & Management through AMR',
      bp_id: 'bp-001',
      copies_count: 3,
      points: 10,
    },
    {
      bp_title: 'Water Recycling System',
      bp_id: 'bp-008',
      copies_count: 0,
      points: 10,
    },
  ],
  originatedCount: 2,
  originatedPoints: 20,
};


