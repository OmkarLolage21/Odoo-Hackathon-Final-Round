import { useAuth } from '../../contexts/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function AuthStatusBanner() {
  const { authError } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (authError) {
      setVisible(true);
    }
  }, [authError]);

  if (!authError || !visible) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 py-3">
      <div className="max-w-xl w-full bg-red-600 text-white shadow-lg rounded-lg flex items-start gap-3 p-3">
        <div className="flex-1 text-sm">
          <p className="font-semibold">Session Notice</p>
          <p className="opacity-90">{authError}</p>
        </div>
  <button onClick={() => setVisible(false)} aria-label="Dismiss session notice" className="p-1 hover:bg-red-500/40 rounded transition-colors">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
