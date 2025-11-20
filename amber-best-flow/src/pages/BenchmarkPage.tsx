/**
 * Benchmark Page Component
 * Shows benchmarked practices list (Plant users only)
 */

import { useNavigate } from 'react-router-dom';
import BenchmarkedList from '@/components/BenchmarkedList';
import { useAuth } from '@/contexts/AuthContext';
import { useBenchmarkedPractices, useUnbenchmarkPractice } from '@/hooks/useBenchmarking';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

const BenchmarkPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch benchmarked practices from backend
  const { data: benchmarkedList, isLoading, error } = useBenchmarkedPractices();
  const unbenchmarkMutation = useUnbenchmarkPractice();

  // Transform benchmarked list items to include full practice details
  const practicesWithDetails = useMemo(() => {
    if (!benchmarkedList) return [];

    return benchmarkedList.map((benchmarkedItem: any) => {
      // Map backend fields to component expected fields
      return {
        id: benchmarkedItem.practice_id, // Use practice_id as the main ID
        practice_id: benchmarkedItem.practice_id,
        title: benchmarkedItem.practice_title,
        category: benchmarkedItem.practice_category,
        category_name: benchmarkedItem.practice_category,
        plant: benchmarkedItem.plant_name,
        plant_name: benchmarkedItem.plant_name,
        description: benchmarkedItem.description || `${benchmarkedItem.practice_title} - Best practice from ${benchmarkedItem.plant_name}`,
        benchmarked_date: benchmarkedItem.benchmarked_date,
        copy_count: benchmarkedItem.copy_count || 0,
        // Include original benchmarked item data for reference
        benchmarked_item: benchmarkedItem
      };
    });
  }, [benchmarkedList]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-accent/30 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading benchmarked practices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-accent/30 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Error loading benchmarked practices</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-primary hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleUnbenchmark = async (practice: any) => {
    // Use the practice_id from the practice object
    const practiceId = practice.practice_id || practice.id;
    if (practiceId) {
      try {
        await unbenchmarkMutation.mutateAsync(practiceId);
        // Navigation will happen automatically via query invalidation
      } catch (error) {
        console.error('Failed to unbenchmark practice:', error);
      }
    }
  };

  const handleCopyAndImplement = (bpData: any) => {
    navigate('/practices/add', {
      state: {
        preFillData: {
          title: bpData.title,
          category: bpData.category || bpData.category_name,
          problemStatement: bpData.problemStatement || bpData.problem || "",
          solution: bpData.solution || bpData.description || "",
        },
        pendingCopyMeta: {
          originPlant: bpData.originPlant || bpData.plant || bpData.plant_name,
          bpTitle: bpData.title,
          originalPracticeId: bpData.practice_id || bpData.id
        }
      }
    });
  };

  return (
    <BenchmarkedList
      items={practicesWithDetails}
      onUnbenchmark={handleUnbenchmark}
      onCopyAndImplement={handleCopyAndImplement}
    />
  );
};

export default BenchmarkPage;

