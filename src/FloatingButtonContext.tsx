import React, { createContext, useState, useCallback } from 'react';

interface FloatingButtonContextType {
  isVisible: boolean;
  toggleVisibility: (visible: boolean) => void;
}

export const FloatingButtonContext = createContext<FloatingButtonContextType | undefined>(undefined);

export const FloatingButtonProvider: React.FC = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  return (
    <FloatingButtonContext.Provider value={{ isVisible, toggleVisibility }}>
      {children}
    </FloatingButtonContext.Provider>
  );
};

