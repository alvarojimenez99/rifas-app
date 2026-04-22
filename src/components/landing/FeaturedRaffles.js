import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rifasService } from '../../services/api';

const FeaturedRaffles = () => {
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dados de exemplo para mostrar se não houver rifas na API
  const mockRifas = [
    {
      id: '1',
      title: 'iPhone 15 Pro Max 256GB',
      description: 'O celular mais avançado da Apple. Câmera de 48MP, chip A17 Pro e bateria de longa duração.',
      image: '📱',
      price: 10,
      total_numbers: 100,
      numbers_sold: 47,
      days_left: 12,
      prize_value: 7999
    },
    {
      id: '2',
      title: 'Samsung Smart TV 65" 4K',
      description: 'TV QLED com tecnologia Neo Quantum, som imersivo e acesso a todos os streamings.',
      image: '📺',
      price: 15,
      total_numbers: 80,
      numbers_sold: 23,
      days_left: 18,
      prize_value: 4299
    },
    {
      id: '3',
      title: 'PlayStation 5 + 2 Jogos',
      description: 'Console PlayStation 5 com controle DualSense e dois jogos à sua escolha.',
      image: '🎮',
      price: 20,
      total_numbers: 60,
      numbers_sold: 38,
      days_left: 9,
      prize_value: 4799
    },
    {
      id: '4',
      title: 'Viagem para Fernando de Noronha',
      description: 'Pacote completo para 2 pessoas com passagens e hospedagem de 7 dias.',
      image: '🏝️',
      price: 25,
      total_numbers: 50,
      numbers_sold: 12,
      days_left: 25,
      prize_value: 12999
    },
    {
      id: '5',
      title: 'Notebook Dell XPS 15',
      description: 'Notebook premium com processador Intel i7, 32GB RAM e 1TB SSD.',
      image: '💻',
      price: 30,
      total_numbers: 40,
      numbers_sold: 19,
      days_left: 14,
      prize_value: 12499
    },
    {
      id: '6',
      title: 'Moto 0km - Honda Biz 125',
      description: 'Moto nova Biz 125, econômica e perfeita para o dia a dia.',
      image: '🏍️',
      price: 50,
      total_numbers: 120,
      numbers_sold: 45,
      days_left: 21,
      prize_value: 14990
    }
  ];

  useEffect(() => {
    const loadRifas = async () => {
      try {
        const response = await rifasService.getPublicRifas();
        if (response.rifas && response.rifas.length > 0) {
          const rifasFormatadas = response.rifas.slice(0, 6).map(rifa => ({
            id: rifa.id,
            title: rifa.nombre || rifa.title,
            description: rifa.descripcion || rifa.description,
            image: rifa.imagen_url || rifa.image_url || getRandomIcon(),
            price: rifa.precio || rifa.price_per_number || 10,
            total_numbers: rifa.cantidad_elementos || rifa.total_numbers || 100,
            numbers_sold: rifa.elementos_vendidos || 0,
            days_left: calcularDiasRestantes(rifa.fecha_fin || rifa.end_date),
            prize_value: rifa.premio_valor || rifa.price_per_number * 100
          }));
          setRifas(rifasFormatadas);
        } else {
          setRifas(mockRifas);
        }
      } catch (error) {
        console.error('Erro carregando rifas:', error);
        setRifas(mockRifas);
      } finally {
        setLoading(false);
      }
    };

    loadRifas();
  }, []);

  const calcularDiasRestantes = (fechaFin) => {
    if (!fechaFin) return 15;
    const fin = new Date(fechaFin);
    const hoje = new Date();
    const diff = Math.ceil((fin - hoje) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 7;
  };

  const getRandomIcon = () => {
    const icons = ['🎁', '🏆', '💰', '🎯', '⭐', '🔥'];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  const calcularProgresso = (vendidos, total) => {
    return (vendidos / total) * 100;
  };

  const formatarPreco = (preco) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  if (loading) {
    return (
      <section className="grana-featured">
        <div className="grana-featured-container">
          <div className="grana-featured-header">
            <h2>🎁 Carregando rifas...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grana-featured">
      <div className="grana-featured-container">
        <div className="grana-featured-header">
          <span className="grana-featured-badge">🎁 Prêmios em Destaque</span>
          <h2 className="grana-featured-title">
            Rifas <span>imperdíveis</span> para você
          </h2>
          <p className="grana-featured-subtitle">
            Escolha sua rifa favorita, compre seu número e concorra a prêmios incríveis.
          </p>
        </div>

        <div className="grana-featured-grid">
          {rifas.map((rifa) => {
            const progresso = calcularProgresso(rifa.numbers_sold, rifa.total_numbers);
            return (
              <div key={rifa.id} className="grana-featured-card">
                <div className="grana-featured-card-image">
                  <span className="grana-featured-emoji">{rifa.image}</span>
                  {rifa.days_left <= 7 && (
                    <span className="grana-featured-urgent">🔥 Últimos dias</span>
                  )}
                </div>
                <div className="grana-featured-card-content">
                  <h3 className="grana-featured-card-title">{rifa.title}</h3>
                  <p className="grana-featured-card-description">{rifa.description}</p>
                  
                  <div className="grana-featured-progress">
                    <div className="grana-featured-progress-bar">
                      <div 
                        className="grana-featured-progress-fill" 
                        style={{ width: `${progresso}%` }}
                      ></div>
                    </div>
                    <div className="grana-featured-progress-stats">
                      <span>{rifa.numbers_sold} vendidos</span>
                      <span>{rifa.total_numbers - rifa.numbers_sold} disponíveis</span>
                    </div>
                  </div>

                  <div className="grana-featured-card-footer">
                    <div className="grana-featured-price">
                      <span className="grana-featured-price-label">Valor do bilhete</span>
                      <span className="grana-featured-price-value">{formatarPreco(rifa.price)}</span>
                    </div>
                    <div className="grana-featured-days">
                      <span>⏰ {rifa.days_left} dias</span>
                    </div>
                  </div>

                  <Link 
                    to={`/public/${rifa.id}`} 
                    className="grana-featured-btn"
                  >
                    <span>Participar</span>
                    <span className="grana-featured-btn-arrow">→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grana-featured-footer">
          <Link to="/portal" className="grana-featured-view-all">
            Ver todas as rifas
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedRaffles;