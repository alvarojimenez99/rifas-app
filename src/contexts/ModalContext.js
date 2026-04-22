import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const showLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const showRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <ModalContext.Provider value={{
      showAuthModal,
      authMode,
      showLogin,
      showRegister,
      closeAuthModal
    }}>
      {children}
    </ModalContext.Provider>
  );
};