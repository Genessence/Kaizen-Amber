/**
 * Approvals Page Component
 * Shows practices pending benchmark approval (HQ users only)
 */

import { useNavigate } from 'react-router-dom';
import ApprovalsList from '@/components/ApprovalsList';
import { useAuth } from '@/contexts/AuthContext';

const ApprovalsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const isBenchmarked = (id?: string) => {
    // This should check against actual benchmarked practices
    return false;
  };

  return (
    <ApprovalsList
      userRole={user.role}
      isBenchmarked={isBenchmarked}
    />
  );
};

export default ApprovalsPage;

