import { Text } from 'react-native';
import { FeeAccount } from '@/components/fees/FeeAccount';
import { ParentChildSwitcher } from '@/components/parent/ParentChildSwitcher';
import { useParentPortal } from '@/context/ParentPortalContext';
export default function ParentFees() {
  const { selectedStudentId, loading, error } = useParentPortal();
  return selectedStudentId ? (
    <FeeAccount key={selectedStudentId} studentId={selectedStudentId} header={<ParentChildSwitcher />} />
  ) : (
    <>
      <ParentChildSwitcher />
      <Text>{error || (loading ? 'Loading children?' : 'No linked children.')}</Text>
    </>
  );
}
