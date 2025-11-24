/**
 * Add Practice Page Component
 * Form for creating a new best practice
 */

import { useNavigate, useLocation } from 'react-router-dom';
import BestPracticeForm from '@/components/BestPracticeForm';

const AddPracticePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get pre-fill data from route state (for copy & implement flow)
  const preFillData = location.state?.preFillData || null;
  const pendingCopyMeta = location.state?.pendingCopyMeta || null;

  return (
    <BestPracticeForm 
      preFillData={preFillData}
      pendingCopyMeta={pendingCopyMeta}
    />
  );
};

export default AddPracticePage;

