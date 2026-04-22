import React from 'react';

const PaymentSection = () => {
  return (
    <section className="grana-payment-section">
      <div className="grana-payment-container">
        <div className="grana-payment-header">
          <span className="grana-payment-badge">💳 Pagamentos</span>
          <h2 className="grana-payment-title">
            Pagamento <span>100% seguro</span>
          </h2>
          <p className="grana-payment-subtitle">
            Escolha a forma de pagamento mais conveniente e concorra com tranquilidade.
          </p>
        </div>

        <div className="grana-payment-grid">
          <div className="grana-payment-card">
            <div className="grana-payment-icon">⚡</div>
            <h3>PIX</h3>
            <p>Pagamento instantâneo e sem taxas. O QR Code é gerado automaticamente para você.</p>
          </div>

          <div className="grana-payment-card">
            <div className="grana-payment-icon">💳</div>
            <h3>Cartão de Crédito</h3>
            <p>Aceitamos Visa, Mastercard, Elo e American Express. Parcelamento disponível.</p>
          </div>

          <div className="grana-payment-card">
            <div className="grana-payment-icon">🏦</div>
            <h3>Transferência Bancária</h3>
            <p>Pagamento via TED ou DOC para a conta do organizador da rifa.</p>
          </div>

          <div className="grana-payment-card">
            <div className="grana-payment-icon">🔒</div>
            <h3>Ambiente Seguro</h3>
            <p>Todos os pagamentos são processados com criptografia de ponta a ponta.</p>
          </div>
        </div>

        <div className="grana-payment-trust">
          <div className="grana-trust-badge">
            <span>🔒</span>
            <span>SSL Security</span>
          </div>
          <div className="grana-trust-badge">
            <span>⚡</span>
            <span>PIX Instantâneo</span>
          </div>
          <div className="grana-trust-badge">
            <span>💳</span>
            <span>Pagamento Seguro</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentSection;