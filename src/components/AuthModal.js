import React, { useState } from 'react';
import LoginModal from './modals/LoginModal';
import RegisterModal from './modals/RegisterModal';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);

  // Reset mode cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  return (
    <>
      <LoginModal 
        isOpen={isOpen && mode === 'login'} 
        onClose={onClose}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal 
        isOpen={isOpen && mode === 'register'} 
        onClose={onClose}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
};

export default AuthModal;