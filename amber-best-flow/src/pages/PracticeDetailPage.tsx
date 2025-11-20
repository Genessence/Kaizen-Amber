/**
 * Practice Detail Page Component
 * Shows detailed view of a single best practice
 */

import { useParams, useNavigate } from 'react-router-dom';
import BestPracticeDetail from '@/components/BestPracticeDetail';
import { useAuth } from '@/contexts/AuthContext';
import { useBestPractice } from '@/hooks/useBestPractices';
import { Loader2 } from 'lucide-react';

const PracticeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch practice data using the ID from URL
  const { data: practice, isLoading } = useBestPractice(id);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-accent/30 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading practice details...</p>
        </div>
      </div>
    );
  }

  if (!practice && !id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-accent/30 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Practice not found</p>
          <button 
            onClick={() => navigate('/practices')}
            className="mt-4 text-primary hover:underline"
          >
            Back to Practices
          </button>
        </div>
      </div>
    );
  }

  return (
    <BestPracticeDetail
      userRole={user.role}
      practice={practice}
      isBenchmarked={practice?.is_benchmarked}
    />
  );
};

export default PracticeDetailPage;

