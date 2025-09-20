import React from 'react';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

interface ActionBarProps {
  onNew?: () => void;
  onConfirm?: () => void;
  onArchiveChange?: (archived: boolean) => void;
  onHome?: () => void;
  onBack?: () => void;
  isConfirmDisabled?: boolean;
  initialArchived?: boolean;
}

// Generic action bar matching wireframe: New | Confirm | Archived | Home | Back
export default function ActionBar({
  onNew,
  onConfirm,
  onArchiveChange,
  onHome,
  onBack,
  isConfirmDisabled,
  initialArchived = false
}: ActionBarProps) {
  const navigate = useNavigate();
  const [archived, setArchived] = React.useState(initialArchived);

  const toggleArchived = () => {
    setArchived(a => {
      const next = !a;
      onArchiveChange?.(next);
      return next;
    });
  };
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-6">
      <Button size="sm" variant="secondary" onClick={onNew}>New</Button>
      <Button size="sm" variant="primary" onClick={onConfirm} disabled={isConfirmDisabled}>Confirm</Button>
      <Button size="sm" variant={archived ? 'danger' : 'secondary'} onClick={toggleArchived}>{archived ? 'Unarchive' : 'Archive'}</Button>
      <Button size="sm" variant="ghost" onClick={onHome || (() => navigate('/'))}>Home</Button>
      <Button size="sm" variant="ghost" onClick={onBack}>Back</Button>
    </div>
  );
}
