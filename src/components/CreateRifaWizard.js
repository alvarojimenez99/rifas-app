import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TermsAndConditions from './TermsAndConditions';
import { catalogosService } from '../services/api';
import { showError, showSuccess } from '../utils/swal';
import { API_BASE } from '../config/api';

// Mapa completo de colores
const coloresMap = {
  'rojo': '#FF0000', 'azul': '#0000FF', 'verde': '#00FF00', 'amarillo': '#FFFF00',
  'morado': '#800080', 'naranja': '#FFA500', 'negro': '#000000', 'blanco': '#FFFFFF',
  'marrón': '#8B4513', 'rosa': '#FFC0CB', 'gris': '#808080',
  'rojo oscuro': '#8B0000', 'rojo claro': '#FFB6C1', 'azul oscuro': '#000080',
  'azul claro': '#87CEEB', 'verde oscuro': '#006400', 'verde claro': '#90EE90',
  'amarillo oscuro': '#B8860B', 'amarillo claro': '#FFFFE0', 'amarillo dorado': '#FFD700',
  'morado oscuro': '#4B0082', 'morado claro': '#DDA0DD', 'púrpura': '#6A0DAD',
  'violeta': '#8A2BE2', 'lavanda': '#E6E6FA', 'magenta': '#FF00FF',
  'oro': '#FFD700', 'plata': '#C0C0C0', 'turquesa': '#40E0D0', 'esmeralda': '#50C878',
  'coral': '#FF7F50', 'salmón': '#FA8072', 'melocotón': '#FFDAB9', 'menta': '#98FB98'
};

const generarElementosRifa = (tipo, cantidad) => {
  switch (tipo) {
    case 'numeros':
      return Array.from({ length: cantidad }, (_, i) => i + 1);
    case 'baraja':
      const palos = ['♠', '♥', '♦', '♣'];
      const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const cartas = [];
      palos.forEach(palo => {
        valores.forEach(valor => {
          cartas.push(`${valor}${palo}`);
        });
      });
      cartas.push('🃏', '🂠');
      return cartas.slice(0, cantidad);
    case 'abecedario':
      return Array.from({ length: Math.min(cantidad, 26) }, (_, i) => String.fromCharCode(65 + i));
    case 'animales':
      const animales = ['🐭 Rata', '🐮 Buey', '🐯 Tigre', '🐰 Conejo', '🐲 Dragón', '🐍 Serpiente', 
                       '🐴 Caballo', '🐐 Cabra', '🐵 Mono', '🐔 Gallo', '🐶 Perro', '🐷 Cerdo'];
      return animales.slice(0, Math.min(cantidad, 12));
    case 'colores':
      const coloresBasicos = ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Morado', 'Naranja', 'Negro', 'Blanco', 'Marrón', 'Rosa'];
      return coloresBasicos.slice(0, Math.min(cantidad, coloresBasicos.length));
    case 'equipos':
      const equipos = ['🇲🇽 América', '🇲🇽 Chivas', '🇲🇽 Cruz Azul', '🇲🇽 Pumas', '🇲🇽 Tigres', 
                      '🇲🇽 Monterrey', '🇲🇽 Santos', '🇲🇽 Pachuca', '🇲🇽 Toluca', '🇲🇽 Atlas',
                      '🇪🇸 Real Madrid', '🇪🇸 Barcelona', '🇪🇸 Atlético', '🇮🇹 Juventus', '🇮🇹 Milan',
                      '🇩🇪 Bayern', '🇬🇧 Manchester United', '🇬🇧 Liverpool', '🇫🇷 PSG', '🇧🇷 Flamengo'];
      return equipos.slice(0, Math.min(cantidad, 20));
    case 'emojis':
      const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '📷', '📸', '📹', '🎬', '📺', '📻', '🎙️', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'];
      return emojis.slice(0, Math.min(cantidad, 100));
    case 'paises':
      const paises = ['🇺🇸 Estados Unidos', '🇨🇦 Canadá', '🇲🇽 México', '🇧🇷 Brasil', '🇦🇷 Argentina', '🇨🇱 Chile', '🇵🇪 Perú', '🇨🇴 Colombia', '🇻🇪 Venezuela', '🇪🇨 Ecuador', '🇧🇴 Bolivia', '🇵🇾 Paraguay', '🇺🇾 Uruguay', '🇪🇸 España', '🇫🇷 Francia', '🇩🇪 Alemania', '🇮🇹 Italia', '🇬🇧 Reino Unido', '🇳🇱 Países Bajos', '🇧🇪 Bélgica', '🇨🇭 Suiza', '🇦🇹 Austria', '🇵🇱 Polonia', '🇷🇺 Rusia', '🇺🇦 Ucrania', '🇸🇪 Suecia', '🇳🇴 Noruega', '🇩🇰 Dinamarca', '🇫🇮 Finlandia', '🇮🇸 Islandia', '🇮🇪 Irlanda', '🇵🇹 Portugal', '🇬🇷 Grecia', '🇨🇳 China', '🇯🇵 Japón', '🇰🇷 Corea del Sur', '🇮🇳 India', '🇹🇭 Tailandia', '🇻🇳 Vietnam', '🇵🇭 Filipinas', '🇮🇩 Indonesia', '🇲🇾 Malasia', '🇸🇬 Singapur', '🇪🇬 Egipto', '🇿🇦 Sudáfrica', '🇳🇬 Nigeria', '🇦🇺 Australia', '🇳🇿 Nueva Zelanda'];
      return paises.slice(0, Math.min(cantidad, 100));
    default:
      return Array.from({ length: cantidad }, (_, i) => i + 1);
  }
};

// Función para subir una imagen al servidor
const subirImagenAlServidor = async (file) => {
  const formData = new FormData();
  formData.append('imagen', file);
  
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/rifas/upload-imagen`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Error al subir la imagen');
  }
  
  const data = await response.json();
  return data.url;
};

const CreateRifaWizard = ({ nuevaRifa, setNuevaRifa, tiposRifas, manejarCambioTipo, agregarRifa, agregarPremio, actualizarPremio, eliminarPremio, manejarFotosPremios, eliminarFoto, actualizarFormaPago }) => {
  const { t } = useTranslation();
  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [mostrarMensajeExito, setMostrarMensajeExito] = useState(false);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  
  // Estados para catálogos
  const [categorias, setCategorias] = useState([]);
  const [, setCargandoPaises] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  
  const totalPasos = 4;

  // Cargar países
  useEffect(() => {
    const cargarPaises = async () => {
      try {
        setCargandoPaises(true);
        const response = await catalogosService.getPaises();
        // setPaises(response.paises || []);
      } catch (error) {
        console.error('Error cargando países:', error);
      } finally {
        setCargandoPaises(false);
      }
    };
    cargarPaises();
  }, []);

  // Cargar categorías
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setCargandoCategorias(true);
        const response = await catalogosService.getCategorias();
        setCategorias(response.categorias || []);
      } catch (error) {
        console.error('Error cargando categorías:', error);
      } finally {
        setCargandoCategorias(false);
      }
    };
    cargarCategorias();
  }, []);

  useEffect(() => {
    if (pasoActual === 3 && (!nuevaRifa.premios || nuevaRifa.premios.length === 0)) {
      const primerPremio = {
        id: Date.now(),
        nombre: '',
        descripcion: '',
        posicion: 1,
        fotos: []
      };
      setNuevaRifa({
        ...nuevaRifa,
        premios: [primerPremio]
      });
    }
  }, [pasoActual, nuevaRifa, setNuevaRifa]);

  const siguientePaso = () => {
    if (pasoActual < totalPasos) {
      setPasoActual(pasoActual + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  const puedeContinuar = () => {
    switch (pasoActual) {
      case 1:
        return nuevaRifa.nombre && nuevaRifa.precio;
      case 2:
        return nuevaRifa.categoria && nuevaRifa.cantidadNumeros;
      case 3:
        return nuevaRifa.premios?.[0]?.nombre;
      case 4:
        return terminosAceptados && nuevaRifa.pixKey;
      default:
        return false;
    }
  };

  // Manejar selección de fotos y subirlas al servidor
  const manejarSeleccionFotos = async (e) => {
    const archivos = Array.from(e.target.files);
    if (archivos.length === 0) return;
    
    setSubiendoFotos(true);
    
    try {
      const urlsSubidas = [];
      
      for (const archivo of archivos) {
        try {
          const url = await subirImagenAlServidor(archivo);
          urlsSubidas.push({
            id: Date.now() + Math.random(),
            url: url,
            url_foto: url,
            descricao: '',
            orden: nuevaRifa.fotosPremios?.length || 0
          });
          console.log('✅ Imagen subida:', url);
        } catch (err) {
          console.error('Error subiendo imagen:', err);
          showError('Erro', `Não foi possível subir a imagem: ${archivo.name}`);
        }
      }
      
      const fotosActuales = nuevaRifa.fotosPremios || [];
      setNuevaRifa({
        ...nuevaRifa,
        fotosPremios: [...fotosActuales, ...urlsSubidas]
      });
      
      if (urlsSubidas.length > 0) {
        showSuccess('Sucesso', `${urlsSubidas.length} foto(s) subida(s) com sucesso`);
      }
    } catch (error) {
      console.error('Error procesando fotos:', error);
      showError('Erro', 'Erro ao processar as fotos');
    } finally {
      setSubiendoFotos(false);
      e.target.value = '';
    }
  };

  const manejarEliminarFoto = (fotoId) => {
    const nuevasFotos = (nuevaRifa.fotosPremios || []).filter(f => f.id !== fotoId);
    setNuevaRifa({...nuevaRifa, fotosPremios: nuevasFotos});
  };

  const manejarCrearRifa = async () => {
    if (!nuevaRifa.fotosPremios || nuevaRifa.fotosPremios.length === 0) {
      const confirmar = window.confirm('Você não adicionou fotos do prêmio. Deseja continuar?');
      if (!confirmar) return;
    }
    
    const datosParaEnviar = {
      ...nuevaRifa,
      fotosPremios: (nuevaRifa.fotosPremios || []).map(foto => ({
        url: foto.url || foto.url_foto,
        url_foto: foto.url || foto.url_foto,
        descricao: foto.descricao || '',
        orden: foto.orden || 0
      }))
    };
    
    console.log('📸 Enviando fotos:', datosParaEnviar.fotosPremios);
    
    const rifaId = await agregarRifa(datosParaEnviar);
    if (rifaId) {
      setMostrarMensajeExito(true);
      setTimeout(() => {
        window.location.href = '/rifas';
      }, 3000);
    }
  };

  const manejarAceptarTerminos = () => {
    setTerminosAceptados(true);
    setMostrarTerminos(false);
  };

  const manejarRechazarTerminos = () => {
    setMostrarTerminos(false);
  };

  const renderPaso = () => {
    switch (pasoActual) {
      case 1:
        return (
          <div className="paso-contenido-modern">
            <div className="step-header-modern">
              <div className="step-icon-modern">📝</div>
              <div>
                <h2 className="step-title-modern">Informações Básicas</h2>
                <p className="step-description">Defina os dados principais da sua rifa</p>
              </div>
            </div>
            <div className="form-section-modern">
              <div className="form-group-modern">
                <label><span className="label-text">Nome da Rifa *</span></label>
                <input
                  type="text"
                  placeholder="Ex: iPhone 15 Pro Max"
                  value={nuevaRifa.nombre}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, nombre: e.target.value})}
                  className="input-modern"
                />
              </div>
              
              <div className="form-group-modern">
                <label>Descrição</label>
                <textarea
                  placeholder="Descreva os prêmios, como funcionará o sorteio..."
                  value={nuevaRifa.descripcion}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, descripcion: e.target.value})}
                  className="textarea-modern"
                  rows="4"
                />
              </div>
            </div>

            <div className="form-section-modern">
              <div className="form-group-modern">
                <label>Tipo de Rifa *</label>
                <select
                  value={nuevaRifa.tipo}
                  onChange={(e) => manejarCambioTipo(e.target.value)}
                  className="select-modern"
                >
                  <option value="numeros">Números</option>
                  <option value="baraja">Baraja</option>
                  <option value="abecedario">Abecedario</option>
                  <option value="animales">Animales</option>
                  <option value="colores">Colores</option>
                  <option value="equipos">Equipos</option>
                  <option value="emojis">Emojis</option>
                  <option value="paises">Países</option>
                </select>
                <div className="tipo-info-card">
                  <span className="info-icon">ℹ️</span>
                  <span className="info-text">{tiposRifas[nuevaRifa.tipo]?.descripcion}</span>
                </div>
              </div>
              
              <div className="form-group-modern">
                <label>Preço por número (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10.00"
                  value={nuevaRifa.precio}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, precio: e.target.value})}
                  className="input-modern"
                />
              </div>
            </div>

            <div className="form-section-modern">
              <div className="form-group-modern">
                <label>Visibilidade</label>
                <div className="visibility-options-modern">
                  <label className={`radio-option-modern ${!nuevaRifa.esPrivada ? 'active' : ''}`}>
                    <input type="radio" name="visibilidad" checked={!nuevaRifa.esPrivada} onChange={() => setNuevaRifa({...nuevaRifa, esPrivada: false})} />
                    <span className="radio-content">
                      <span className="radio-icon">🌍</span>
                      <div><strong>Pública</strong><small>Visível para todos os participantes</small></div>
                    </span>
                  </label>
                  <label className={`radio-option-modern ${nuevaRifa.esPrivada ? 'active' : ''}`}>
                    <input type="radio" name="visibilidad" checked={nuevaRifa.esPrivada} onChange={() => setNuevaRifa({...nuevaRifa, esPrivada: true})} />
                    <span className="radio-content">
                      <span className="radio-icon">🔒</span>
                      <div><strong>Privada</strong><small>Apenas com link direto</small></div>
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="form-group-modern">
                <label>Data de encerramento</label>
                <input
                  type="date"
                  value={nuevaRifa.fechaFin}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, fechaFin: e.target.value})}
                  className="input-modern"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="paso-contenido-modern">
            <div className="step-header-modern">
              <div className="step-icon-modern">🏷️</div>
              <div>
                <h2 className="step-title-modern">Categoria da Rifa</h2>
                <p className="step-description">Selecione a categoria que melhor descreve sua rifa</p>
              </div>
            </div>

            <div className="form-section-modern">
              <div className="form-group-modern">
                <label>Categoria da Rifa *</label>
                {cargandoCategorias ? (
                  <div className="loading-categorias">Carregando categorias...</div>
                ) : (
                  <select
                    value={nuevaRifa.categoria || ''}
                    onChange={(e) => setNuevaRifa({...nuevaRifa, categoria: e.target.value})}
                    className="select-modern"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.nome}</option>
                    ))}
                  </select>
                )}
                <small className="input-help">Escolha a categoria que melhor representa o prêmio da sua rifa</small>
              </div>

              <div className="form-group-modern">
                <label>Quantidade de números *</label>
                <input
                  type="number"
                  value={nuevaRifa.cantidadNumeros}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, cantidadNumeros: parseInt(e.target.value) || 1})}
                  min="1"
                  max="10000"
                  className="input-modern"
                  required
                />
                <small className="input-help">Defina quantos números estarão disponíveis para venda</small>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="paso-contenido-modern">
            <div className="step-header-modern">
              <div className="step-icon-modern">🏆</div>
              <div>
                <h2 className="step-title-modern">Prêmio da Rifa</h2>
                <p className="step-description">Configure o prêmio principal e seus detalhes</p>
              </div>
            </div>
          
            <div className="form-section-modern">
              <div className="form-group-modern">
                <label>Nome do Prêmio *</label>
                <input
                  type="text"
                  placeholder="Ex: iPhone 15 Pro Max, Viagem para Fernando de Noronha"
                  value={nuevaRifa.premios?.[0]?.nombre || ''}
                  onChange={(e) => {
                    const nuevosPremios = [...(nuevaRifa.premios || [])];
                    if (nuevosPremios.length === 0) {
                      nuevosPremios.push({ id: Date.now(), nombre: '', descripcion: '', posicion: 1, fotos: [] });
                    }
                    nuevosPremios[0].nombre = e.target.value;
                    setNuevaRifa({...nuevaRifa, premios: nuevosPremios});
                  }}
                  className="input-modern"
                  required
                />
              </div>
          
              <div className="form-group-modern">
                <label>Descrição do Prêmio</label>
                <textarea
  placeholder="Descreva detalhadamente o prêmio..."
  value={nuevaRifa.premios?.[0]?.descripcion || ''}
  onChange={(e) => {
    const nuevosPremios = [...(nuevaRifa.premios || [])];
    if (nuevosPremios.length === 0) {
      nuevosPremios.push({ id: Date.now(), nombre: '', descripcion: '', posicion: 1, fotos: [] });
    }
    nuevosPremios[0].descripcion = e.target.value;
    setNuevaRifa({...nuevaRifa, premios: nuevosPremios});
  }}
  className="textarea-modern"
  rows="6"
  style={{ minHeight: '150px', fontSize: '15px', lineHeight: '1.6' }}
/>
              </div>
          
              {/* Fotos do Prêmio */}
              <div className="form-group-modern">
                <label>Fotos do Prêmio</label>
                <div className="fotos-upload-area">
                  <label className="file-upload-btn-modern">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={manejarSeleccionFotos}
                      disabled={subiendoFotos}
                      style={{ display: 'none' }}
                    />
                    <span className="btn-secondary">
                      {subiendoFotos ? '⏳ Enviando...' : '📸 Adicionar Fotos'}
                    </span>
                  </label>
                  <small className="input-help">Adicione até 5 fotos do prêmio (as imagens serão enviadas ao servidor)</small>
                </div>
                
                {(nuevaRifa.fotosPremios && nuevaRifa.fotosPremios.length > 0) && (
                  <div className="fotos-grid-modern">
                    {nuevaRifa.fotosPremios.map((foto, idx) => (
                      <div key={foto.id || idx} className="foto-item-modern">
                        <img 
                          src={foto.url || foto.url_foto} 
                          alt={`Foto ${idx + 1}`}
                          onError={(e) => {
                            console.error('Erro carregando imagem:', foto.url);
                            e.target.src = 'https://via.placeholder.com/100?text=Erro';
                          }}
                        />
                        <button
                          type="button"
                          className="btn-remover-foto"
                          onClick={() => manejarEliminarFoto(foto.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          
              {/* Link do Vídeo */}
              <div className="form-group-modern">
                <label>Link do Vídeo (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={nuevaRifa.videoUrl || ''}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, videoUrl: e.target.value})}
                  className="input-modern" style={{ padding: '16px 20px', fontSize: '15px' }}
                />
                <small className="input-help">Adicione um vídeo do YouTube mostrando o prêmio</small>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="paso-contenido-modern">
            <div className="step-header-modern">
              <div className="step-icon-modern">🎲</div>
              <div>
                <h2 className="step-title-modern">Sorteio e Pagamento</h2>
                <p className="step-description">Configure como será o sorteio e os métodos de pagamento</p>
              </div>
            </div>
          
         {/* Sorteio e Pagamento */}
<div className="form-section-modern">
  <h3 className="section-subtitle">🎲 Dados do Sorteio</h3>
  
  <div className="form-row-grid">
    <div className="form-group-modern">
      <label>Data do Sorteio *</label>
      <input type="datetime-local" value={nuevaRifa.fechaSorteo || ''} onChange={(e) => setNuevaRifa({...nuevaRifa, fechaSorteo: e.target.value})} className="input-modern" required />
    </div>
    
    <div className="form-group-modern">
      <label>Tipo de Sorteio *</label>
      <select value={nuevaRifa.loteriaTipo || ''} onChange={(e) => setNuevaRifa({...nuevaRifa, loteriaTipo: e.target.value})} className="select-modern" required>
        <option value="">Selecione</option>
        <option value="federal">Loteria Federal</option>
        <option value="megasena">Mega-Sena</option>
        <option value="quina">Quina</option>
        <option value="lotofacil">Lotofácil</option>
        <option value="lotomania">Lotomania</option>
        <option value="duplasena">Dupla Sena</option>
        <option value="timemania">Timemania</option>
        <option value="diadesorte">Dia de Sorte</option>
      </select>
    </div>
  </div>
  
  <div className="form-group-modern">
    <label>Número do Sorteio (Opcional)</label>
    <input type="text" placeholder="Ex: 2654" value={nuevaRifa.numeroSorteio || ''} onChange={(e) => setNuevaRifa({...nuevaRifa, numeroSorteio: e.target.value})} className="input-modern" />
    <small className="input-help">Número do concurso da loteria</small>
  </div>
</div>

{/* Métodos de Pagamento */}
<div className="form-section-modern">
  <h3 className="section-subtitle">💳 Métodos de Pagamento</h3>
  
  <div className="form-group-modern">
    <label>Chave PIX *</label>
    <input type="text" placeholder="CPF, CNPJ, email, telefone ou chave aleatória" value={nuevaRifa.pixKey || ''} onChange={(e) => setNuevaRifa({...nuevaRifa, pixKey: e.target.value})} className="input-modern" required />
    <small className="input-help">Os pagamentos via PIX serão direcionados para esta chave</small>
  </div>

  <div className="form-group-modern">
    <label className="checkbox-label-modern">
      <input type="checkbox" checked={nuevaRifa.aceitaCartao || false} onChange={(e) => setNuevaRifa({...nuevaRifa, aceitaCartao: e.target.checked})} />
      <span>Aceitar pagamento com cartão de crédito</span>
    </label>
    <small className="input-help">Os pagamentos com cartão serão processados via Stripe</small>
  </div>

  <div className="form-group-modern">
    <label className="checkbox-label-modern">
      <input type="checkbox" checked={terminosAceptados} onChange={(e) => setTerminosAceptados(e.target.checked)} />
      <span>Aceito os <button type="button" className="link-button" onClick={() => setMostrarTerminos(true)}>Termos e Condições</button></span>
    </label>
  </div>
</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="create-rifa-wizard-modern">
      <div className="wizard-header-modern">
        <div className="header-content">
          <h1 className="wizard-title-modern">
            <span className="wizard-icon-modern">✨</span>
            Criar Nova Rifa
          </h1>
          <p className="wizard-subtitle">Preencha os dados abaixo para criar sua rifa profissional</p>
        </div>
        
        <div className="wizard-steps-indicator">
          <div className={`wizard-step ${pasoActual >= 1 ? 'active' : ''} ${pasoActual > 1 ? 'completed' : ''}`}>
            <div className="step-circle">{pasoActual > 1 ? '✓' : '1'}</div>
            <span className="step-label">Informações</span>
          </div>
          <div className={`wizard-step ${pasoActual >= 2 ? 'active' : ''} ${pasoActual > 2 ? 'completed' : ''}`}>
            <div className="step-circle">{pasoActual > 2 ? '✓' : '2'}</div>
            <span className="step-label">Categoria</span>
          </div>
          <div className={`wizard-step ${pasoActual >= 3 ? 'active' : ''} ${pasoActual > 3 ? 'completed' : ''}`}>
            <div className="step-circle">{pasoActual > 3 ? '✓' : '3'}</div>
            <span className="step-label">Prêmio</span>
          </div>
          <div className={`wizard-step ${pasoActual >= 4 ? 'active' : ''}`}>
            <div className="step-circle">{pasoActual === 4 ? '4' : ''}</div>
            <span className="step-label">Finalizar</span>
          </div>
        </div>
      </div>

      <div className="wizard-content-modern">
        <div className="step-content-wrapper">
          {renderPaso()}
        </div>
      </div>

      <div className="wizard-actions-modern">
        <button type="button" className="btn-wizard-back" onClick={pasoAnterior} disabled={pasoActual === 1}>
          <span className="btn-icon">←</span>
          <span>Voltar</span>
        </button>
        
        {pasoActual < totalPasos ? (
          <button type="button" className="btn-wizard-next" onClick={siguientePaso} disabled={!puedeContinuar()}>
            <span>Continuar</span>
            <span className="btn-icon">→</span>
          </button>
        ) : (
          <div className="final-step-actions">
            <button type="button" className="btn-wizard-create" onClick={manejarCrearRifa} disabled={!puedeContinuar() || subiendoFotos}>
              <span className="btn-icon">🎯</span>
              <span>{subiendoFotos ? 'Enviando fotos...' : 'Criar Rifa'}</span>
            </button>
          </div>
        )}
      </div>

      {mostrarTerminos && (
        <TermsAndConditions onAccept={manejarAceptarTerminos} onDecline={manejarRechazarTerminos} />
      )}

      {mostrarMensajeExito && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <div className="success-icon">🎉</div>
            <h2>Rifa criada com sucesso!</h2>
            <p>Você será redirecionado para a página de gerenciamento.</p>
            <div className="success-actions">
              <button className="btn-primary" onClick={() => window.location.href = '/rifas'}>Ver minhas rifas</button>
              <button className="btn-secondary" onClick={() => window.location.href = '/'}>Ir para o Início</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .create-rifa-wizard-modern {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          min-height: 100vh;
        }

        .wizard-header-modern {
          margin-bottom: 40px;
          text-align: center;
        }

        .wizard-title-modern {
          font-size: 36px;
          font-weight: 800;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 12px;
        }

        .wizard-subtitle {
          color: #94a3b8;
          font-size: 16px;
        }

        .wizard-steps-indicator {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          margin-bottom: 40px;
          position: relative;
        }

        .wizard-step {
          flex: 1;
          text-align: center;
          position: relative;
        }

        .step-circle {
          width: 44px;
          height: 44px;
          background: rgba(30, 41, 59, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          font-weight: 700;
          color: #94a3b8;
        }

        .wizard-step.active .step-circle {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-color: #f59e0b;
          color: white;
        }

        .wizard-step.completed .step-circle {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .step-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .wizard-step.active .step-label {
          color: #fbbf24;
        }

        .step-header-modern {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .step-icon-modern {
          font-size: 48px;
        }

        .step-title-modern {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 6px;
        }

        .step-description {
          color: #94a3b8;
          font-size: 14px;
        }

        .form-section-modern {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 28px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .form-group-modern {
          margin-bottom: 24px;
        }

        .form-group-modern label {
          display: block;
          color: #f1f5f9 !important;
          margin-bottom: 10px;
          font-weight: 600;
          font-size: 14px;
        }

        .label-text {
          color: #f1f5f9;
        }

        .input-modern, .select-modern, .textarea-modern {
          width: 100%;
          padding: 14px 18px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 15px;
          transition: all 0.2s;
        }

        .input-modern:focus, .select-modern:focus, .textarea-modern:focus {
          outline: none;
          border-color: #f59e0b;
          background: rgba(15, 23, 42, 1);
        }

        .textarea-modern {
          resize: vertical;
          min-height: 100px;
        }

        .section-subtitle {
          font-size: 20px;
          font-weight: 600;
          color: #fbbf24;
          margin-bottom: 24px;
          margin-top: 8px;
        }

        .fotos-upload-area {
          margin-bottom: 20px;
        }

        .btn-secondary {
          display: inline-block;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 12px 24px;
          border-radius: 40px;
          cursor: pointer;
          color: #cbd5e1;
          transition: all 0.2s;
          font-weight: 500;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .fotos-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .foto-item-modern {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .foto-item-modern img {
          width: 100%;
          height: 110px;
          object-fit: cover;
        }

        .btn-remover-foto {
          position: absolute;
          top: 6px;
          right: 6px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          cursor: pointer;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .checkbox-label-modern {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          color: #cbd5e1;
        }

        .wizard-actions-modern {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 40px;
        }

        .btn-wizard-back, .btn-wizard-next, .btn-wizard-create {
          padding: 14px 32px;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 16px;
        }

        .btn-wizard-back {
          background: rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
        }

        .btn-wizard-next, .btn-wizard-create {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .btn-wizard-back:hover, .btn-wizard-next:hover, .btn-wizard-create:hover {
          transform: translateY(-2px);
        }

        .btn-wizard-back:disabled, .btn-wizard-next:disabled, .btn-wizard-create:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .input-help {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
        }

        .tipo-info-card {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 10px;
          display: flex;
          gap: 10px;
        }

        .info-icon {
          font-size: 14px;
        }

        .info-text {
          font-size: 13px;
          color: #94a3b8;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #1e293b;
          border-radius: 24px;
          padding: 36px;
          max-width: 450px;
          text-align: center;
        }

        .success-icon {
          font-size: 72px;
          margin-bottom: 20px;
        }

        .success-actions {
          display: flex;
          gap: 16px;
          margin-top: 28px;
        }

        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 14px;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
        }

        .link-button {
          background: none;
          border: none;
          color: #f59e0b;
          cursor: pointer;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .create-rifa-wizard-modern {
            padding: 20px;
          }
          
          .form-section-modern {
            padding: 20px;
          }
          
          .step-header-modern {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
          
          .wizard-steps-indicator {
            flex-direction: column;
            gap: 16px;
          }
          
          .fotos-grid-modern {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }
          
          .wizard-title-modern {
            font-size: 28px;
          }
          
          .step-title-modern {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateRifaWizard;