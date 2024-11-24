import { useContext } from 'react';
import { FloatingButtonContext } from './FloatingButtonContext';

export const useFloatingButton = () => {
  const context = useContext(FloatingButtonContext);
  if (context === undefined) {
    throw new Error('useFloatingButton must be used within a FloatingButtonProvider');
  }
  return context;
};

