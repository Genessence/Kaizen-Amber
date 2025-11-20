/**
 * Practices List Page Component
 * Shows all best practices
 */

import { useNavigate } from 'react-router-dom';
import PracticeList from '@/components/PracticeList';
import { useAuth } from '@/contexts/AuthContext';
import { useBenchmarkedPractices } from '@/hooks/useBenchmarking';
import { useMemo } from 'react';

const PracticesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch benchmarked practices to check which ones are benchmarked
  const { data: benchmarkedPractices } = useBenchmarkedPractices();

  // Create a Set of benchmarked practice IDs for quick lookup
  const benchmarkedIds = useMemo(() => {
    if (!benchmarkedPractices) return new Set<string>();
    return new Set(benchmarkedPractices.map((bp: any) => bp.practice_id));
  }, [benchmarkedPractices]);

  const isBenchmarked = (id?: string) => {
    if (!id) return false;
    return benchmarkedIds.has(id);
  };

  if (!user) {
    return null;
  }

  return (
    <PracticeList 
      userRole={user.role}
      isBenchmarked={isBenchmarked}
    />
  );
};

export default PracticesPage;

