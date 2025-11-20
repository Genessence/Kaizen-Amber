/**
 * Analytics Page Component
 * Shows analytics dashboard (HQ users only)
 */

import { useNavigate } from 'react-router-dom';
import Analytics from '@/components/Analytics';
import { useAuth } from '@/contexts/AuthContext';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Analytics
      userRole={user.role}
    />
  );
};

export default AnalyticsPage;

