/**
 * Dashboard Page Component
 * Shows role-based dashboard (Plant User or HQ Admin)
 */

import PlantUserDashboard from '@/components/PlantUserDashboard';
import HQAdminDashboard from '@/components/HQAdminDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  return (
    <div className="w-[90%] max-w-[90%] mx-auto">
      {user.role === "plant" ? (
        <PlantUserDashboard />
      ) : (
        <HQAdminDashboard />
      )}
    </div>
  );
};

export default DashboardPage;

