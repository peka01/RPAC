'use client';

import { useState, useEffect } from 'react';

export function TestSyntax() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('test');
  }, []);

  const testFunction = async () => {
    console.log('test function');
  };

  if (loading) {
    return (
      <div>Loading...</div>
    );
  }

  return (
    <div>Test content</div>
  );
}
