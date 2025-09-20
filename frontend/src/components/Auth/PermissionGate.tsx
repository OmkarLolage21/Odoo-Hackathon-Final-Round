import React from 'react';

interface PermissionGateProps {
  allowed: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  inline?: boolean;
}

// Simple reusable permission wrapper
export function PermissionGate({ allowed, fallback = null, children, inline = false }: PermissionGateProps) {
  if (!allowed) return <>{fallback}</>;
  return inline ? <>{children}</> : <>{children}</>;
}

export default PermissionGate;