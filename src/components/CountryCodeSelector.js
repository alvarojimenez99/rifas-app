import React, { useState, useRef, useEffect } from 'react';

const CountryCodeSelector = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const countries = [
    { code: '+55', name: 'Brasil', flag: '🇧🇷', mask: '(##) #####-####' },
    { code: '+1', name: 'EUA', flag: '🇺🇸', mask: '(###) ###-####' },
    { code: '+34', name: 'Espanha', flag: '🇪🇸', mask: '### ### ###' },
    { code: '+52', name: 'México', flag: '🇲🇽', mask: '## #### ####' },
    { code: '+54', name: 'Argentina', flag: '🇦🇷', mask: '### ### ####' },
    { code: '+56', name: 'Chile', flag: '🇨🇱', mask: '# #### ####' },
    { code: '+57', name: 'Colômbia', flag: '🇨🇴', mask: '### ### ####' },
    { code: '+33', name: 'França', flag: '🇫🇷', mask: '# ## ## ## ##' },
    { code: '+49', name: 'Alemanha', flag: '🇩🇪', mask: '### ### ####' },
    { code: '+44', name: 'Reino Unido', flag: '🇬🇧', mask: '#### ### ####' },
    { code: '+351', name: 'Portugal', flag: '🇵🇹', mask: '### ### ###' },
  ];

  const selectedCountry = countries.find(c => c.code === value) || countries[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="country-code-selector" ref={dropdownRef}>
      <button
        type="button"
        className={`country-selector-btn ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedCountry.flag}</span>
        <span>{selectedCountry.code}</span>
        <span className="selector-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="country-dropdown">
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              className={`country-option ${value === country.code ? 'active' : ''}`}
              onClick={() => {
                onChange(country.code);
                setIsOpen(false);
              }}
            >
              <span>{country.flag}</span>
              <span>{country.code}</span>
              <span className="country-name">{country.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector;