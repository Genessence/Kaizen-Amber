/**
 * Benchmark Page Component
 * Shows benchmarked practices list (Plant users only)
 */

import { useNavigate } from 'react-router-dom';
import BenchmarkedList from '@/components/BenchmarkedList';
import { useAuth } from '@/contexts/AuthContext';
import { useBenchmarkedPractices, useUnbenchmarkPractice } from '@/hooks/useBenchmarking';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

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
        problemStatement: benchmarkedItem.problem_statement || '',
        solution: benchmarkedItem.solution || benchmarkedItem.description || '',
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

  const handleCopyAndImplement = async (bpData: any) => {
    // Fetch full practice details to ensure we have all fields including problem_statement
    const practiceId = bpData.practice_id || bpData.id;
    if (!practiceId) {
      toast.error('Practice ID is missing');
      return;
    }

    try {
      // Fetch full practice details
      const fullPractice = await apiService.getBestPractice(practiceId);

      // Prepare pre-fill data - Only 4 fields: title, category, problemStatement, solution
      const problemStatementValue =
        fullPractice.problem_statement ||
        bpData.problemStatement ||
        bpData.problem ||
        "";

      navigate('/practices/add', {
        state: {
          preFillData: {
            title: fullPractice.title || bpData.title,
            category: fullPractice.category_name || bpData.category || bpData.category_name,
            problemStatement: problemStatementValue,
            solution: fullPractice.solution || fullPractice.description || bpData.solution || bpData.description || "",
          },
          pendingCopyMeta: {
            originPlant: fullPractice.plant_name || bpData.plant || bpData.plant_name,
            bpTitle: fullPractice.title || bpData.title,
            originalPracticeId: practiceId
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch practice details:', error);
      toast.error('Failed to load practice details. Please try again.');
    }
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

