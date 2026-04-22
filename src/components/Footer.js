import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="grana-footer">
      <div className="grana-footer-container">
        {/* Seção principal */}
        <div className="grana-footer-main">
          {/* Brand */}
          <div className="grana-footer-brand">
            <div className="grana-footer-logo">
              <span className="grana-footer-logo-icon">💰</span>
              <div className="grana-footer-logo-text">
                <h3>
                  <span style={{ color: '#00d26a' }}>Pele</span>
                  <span style={{ color: '#ffd700' }}>leca</span>
                </h3>
                <p>Sua chance de ganhar prêmios incríveis</p>
              </div>
            </div>
            <p className="grana-footer-description">
              Participe de rifas online seguras e concorra a prêmios que mudam vidas. 
              Escolha seus números, pague com PIX e acompanhe os sorteios ao vivo.
            </p>
          </div>

          {/* Links */}
          <div className="grana-footer-links">
            <div className="grana-footer-section">
              <h4>Rifas</h4>
              <ul>
                <li><Link to="/portal">Ver Rifas</Link></li>
                <li><Link to="/consulta-ganadores">Consultar Ganhadores</Link></li>
                <li><Link to="/como-funciona">Como Funciona</Link></li>
                <li><Link to="/rifas-passadas">Rifas Passadas</Link></li>
              </ul>
            </div>

            <div className="grana-footer-section">
              <h4>Ajuda</h4>
              <ul>
                <li><Link to="/perguntas-frequentes">Perguntas Frequentes</Link></li>
                <li><Link to="/contato">Contato</Link></li>
                <li><Link to="/suporte">Suporte</Link></li>
                <li><Link to="/duvidas">Dúvidas</Link></li>
              </ul>
            </div>

            <div className="grana-footer-section">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/termos-condicoes">Termos de Uso</Link></li>
                <li><Link to="/politica-privacidade">Política de Privacidade</Link></li>
                <li><Link to="/politica-cookies">Política de Cookies</Link></li>
                <li><Link to="/aviso-legal">Aviso Legal</Link></li>
              </ul>
            </div>

            <div className="grana-footer-section">
              <h4>Contato</h4>
              <ul>
                <li><a href="mailto:contato@peleleca.bet">contato@peleleca.bet</a></li>
                <li><a href="https://wa.me/55119999" target="_blank" rel="noopener noreferrer">WhatsApp: (11) 999-99</a></li>
                <li><a href="/atendimento">Atendimento</a></li>
                <li><a href="/imprensa">Imprensa</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Formas de Pagamento */}
        <div className="grana-footer-payments">
          <div className="grana-payments-content">
            <span className="grana-payments-title">Formas de Pagamento</span>
            <div className="grana-payments-icons">
              <span className="grana-payment-icon">💳 Cartão</span>
              <span className="grana-payment-icon">⚡ PIX</span>
              <span className="grana-payment-icon">🏦 TED/DOC</span>
              <span className="grana-payment-icon">🔒 100% Seguro</span>
            </div>
          </div>
        </div>

        {/* Footer inferior */}
        <div className="grana-footer-bottom">
          <div className="grana-footer-copyright">
            <p>© {currentYear} Peleleca. Todos os direitos reservados.</p>
            <p className="grana-footer-security">
              🔒 Ambiente seguro e protegido
            </p>
          </div>
          
          <div className="grana-footer-social">
            <a href="https://instagram.com/peleleca" className="grana-social-link" title="Instagram" target="_blank" rel="noopener noreferrer">
              <span>📷</span>
            </a>
            <a href="https://facebook.com/peleleca" className="grana-social-link" title="Facebook" target="_blank" rel="noopener noreferrer">
              <span>👍</span>
            </a>
            <a href="https://twitter.com/peleleca" className="grana-social-link" title="Twitter" target="_blank" rel="noopener noreferrer">
              <span>🐦</span>
            </a>
            <a href="https://wa.me/551199" className="grana-social-link" title="WhatsApp" target="_blank" rel="noopener noreferrer">
              <span>💬</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;