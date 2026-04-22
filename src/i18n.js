import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traducciones en portugués
const translationPT = {
  common: {
    loading: 'Carregando...',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    back: 'Voltar',
    confirm: 'Confirmar'
  },
  nav: {
    home: 'Início',
    createRaffle: 'Criar Rifa',
    viewRaffles: 'Ver Rifas',
    checkWinners: 'Consultar Ganadores',
    forAdvertisers: 'Anunciantes',
    hello: 'Olá',
    admin: 'Administrador',
    guest: 'Convidado',
    logout: 'Sair',
    menu: 'Menu',
    myPortal: 'Meu Portal',
    settings: 'Configurações'
  },
  landing: {
    subtitle: 'Sua chance de transformar sonhos em realidade',
    description: 'Crie, compartilhe e participe de rifas online de forma segura e transparente.',
    createAccount: 'Criar minha conta',
    iAmAdvertiser: 'Sou Anunciante',
    alreadyHaveAccount: 'Já tem uma conta?',
    login: 'Entrar',
    heroCard: {
      activeRaffle: 'Rifa em destaque',
      available: 'Disponíveis',
      daysRemaining: 'Dias restantes',
      pricePerTicket: 'Valor do bilhete',
      viewRaffle: 'Ver rifa',
      loading: 'Carregando...',
      loadingRaffles: 'Carregando rifas...',
      comingSoon: 'Em breve'
    }
  },
  features: {
    title: 'Por que escolher a GranaFácil?',
    subtitle: 'Tudo o que você precisa para participar de rifas profissionais de forma simples e segura.',
    items: {
      customizable: {
        title: 'Participação Fácil',
        description: 'Escolha seus números favoritos e concorra a prêmios incríveis em poucos cliques.'
      },
      multipleTypes: {
        title: 'Pagamento Seguro',
        description: 'Pague com PIX, cartão de crédito ou transferência bancária com total segurança.'
      },
      securePayments: {
        title: 'Sorteios Transparentes',
        description: 'Acompanhe os sorteios ao vivo com total transparência e credibilidade.'
      },
      transparency: {
        title: '100% Responsivo',
        description: 'Participe de qualquer lugar, direto do seu celular, tablet ou computador.'
      },
      management: {
        title: 'Notificações em Tempo Real',
        description: 'Receba alertas sobre novos sorteios e resultados diretamente no seu email.'
      },
      unlimitedReach: {
        title: 'Prêmios Incríveis',
        description: 'Concorra a prêmios que mudam vidas: iPhones, TVs, viagens e muito mais.'
      }
    },
    benefits: {
      title: 'Vantagens de participar com a GranaFácil',
      reduceCosts: {
        title: 'Prêmios Valiosos',
        description: 'Rifas com prêmios exclusivos e de alto valor.'
      },
      credibility: {
        title: 'Credibilidade',
        description: 'Sorteios ao vivo e resultados verificáveis.'
      },
      scalable: {
        title: 'Acompanhamento Fácil',
        description: 'Acompanhe seus números e sorteios em um só lugar.'
      },
      totalControl: {
        title: 'Diversão Garantida',
        description: 'A emoção de concorrer a prêmios incríveis.'
      }
    }
  },
  howItWorks: {
    title: 'Como Funciona',
    steps: {
      register: {
        title: 'Cadastre-se',
        description: 'Crie sua conta gratuitamente em menos de 1 minuto.'
      },
      create: {
        title: 'Escolha sua rifa',
        description: 'Navegue pelas rifas disponíveis e escolha seus números da sorte.'
      },
      share: {
        title: 'Pague com segurança',
        description: 'Realize o pagamento via PIX, cartão ou transferência.'
      },
      draw: {
        title: 'Acompanhe o sorteio',
        description: 'Assista ao sorteio ao vivo e confira se você foi o vencedor.'
      }
    }
  },
  about: {
    title: 'Sobre nós',
    description1: 'é uma plataforma profissional para rifas online.',
    description2: 'Oferecemos segurança, transparência e ferramentas completas para seus sorteios.',
    forWhoTitle: 'Para quem é a GranaFácil?',
    audience: {
      entrepreneurs: {
        title: 'Empreendedores',
        description: 'Crie rifas para alavancar seu negócio.'
      },
      nonprofit: {
        title: 'ONGs',
        description: 'Arrecade fundos para causas importantes.'
      },
      businesses: {
        title: 'Empresas',
        description: 'Realize ações promocionais incríveis.'
      },
      professionals: {
        title: 'Influenciadores',
        description: 'Engaje sua audiência com rifas exclusivas.'
      }
    }
  },
  cta: {
    title: 'Pronto para participar?',
    subtitle: 'Junte-se a milhares de pessoas que já realizam seus sonhos com a GranaFácil.',
    button: 'Criar minha conta'
  },
  advertisersSection: {
    title: 'Anuncie na GranaFácil',
    subtitle: 'Alcance milhares de participantes em todo o Brasil',
    primaryButton: 'Anunciar agora',
    secondaryButton: 'Saiba mais'
  },
  plans: {
    title: 'Planos para Criadores',
    subtitle: 'Escolha o plano ideal para suas rifas',
    perMonth: '/mês',
    elementsPerRaffle: 'Elementos por rifa',
    currentPlan: 'Plano atual',
    choosePlan: 'Escolher plano',
    features: {
      '1RifaActiva': '1 rifa ativa',
      '10RifasActivas': '10 rifas ativas',
      rifasIlimitadas: 'Rifas ilimitadas',
      comision65: 'Comissão 6.5%',
      comision55: 'Comissão 5.5%',
      comision45: 'Comissão 4.5%',
      pagoSeguroStripe: 'Pagamento seguro com Stripe',
      whatsappParticipantes: 'WhatsApp para participantes',
      soporteEmail: 'Suporte por email',
      soportePrioritario: 'Suporte prioritário',
      soporteDedicado: 'Suporte dedicado',
      estadisticasDetalladas: 'Estatísticas detalhadas',
      estadisticasAvanzadas: 'Estatísticas avançadas',
      gestionParticipantes: 'Gestão de participantes'
    }
  },
  wizard: {
    title: 'Criar Nova Rifa',
    subtitle: 'Preencha os dados abaixo para criar sua rifa profissional',
    required: 'Obrigatório',
    optional: 'Opcional',
    actions: {
      back: 'Voltar',
      next: 'Continuar',
      create: 'Criar Rifa',
      mustAcceptTerms: 'Você deve aceitar os termos para criar a rifa'
    },
    step1: {
      title: 'Informações',
      label: 'Informações Básicas',
      stepDescription: 'Defina os dados principais da sua rifa',
      raffleName: 'Nome da Rifa',
      raffleNamePlaceholder: 'Ex: iPhone 15 Pro Max',
      raffleNameHelp: 'Escolha um nome atrativo para sua rifa',
      description: 'Descrição',
      descriptionPlaceholder: 'Descreva os prêmios, como funcionará o sorteio...',
      descriptionHelp: 'Detalhe os prêmios e as regras principais',
      raffleType: 'Tipo de Rifa',
      types: {
        numbers: 'Números',
        deck: 'Baralho',
        alphabet: 'Abecedário',
        animals: 'Animais',
        colors: 'Cores',
        teams: 'Times',
        emojis: 'Emojis',
        countries: 'Países'
      },
      pricePerElement: 'Preço por {element}',
      pricePlaceholder: '10.00',
      priceHelp: 'Valor que cada participante pagará por {element}',
      category: 'Categoria',
      categoryPlaceholder: 'Selecione uma categoria',
      categories: {
        properties: 'Imóveis',
        vehicles: 'Veículos',
        technology: 'Tecnologia',
        experiences: 'Experiências',
        sports: 'Esportes',
        jewellery: 'Joias',
        travel: 'Viagens',
        fashion: 'Moda',
        food: 'Alimentos',
        health: 'Saúde',
        kids: 'Infantil',
        cash: 'Dinheiro',
        other: 'Outros'
      },
      categoryHelp: 'Selecione a categoria do prêmio principal',
      visibility: 'Visibilidade',
      public: 'Pública',
      publicDesc: 'Visível para todos os participantes',
      private: 'Privada',
      privateDesc: 'Apenas com link direto',
      endDate: 'Data de encerramento',
      endDateHelp: 'Data final para participações',
      location: 'Localização',
      locationDesc: 'Informe a localização da rifa',
      country: 'País',
      selectCountry: 'Selecione um país',
      state: 'Estado',
      selectState: 'Selecione um estado',
      city: 'Cidade',
      cityPlaceholder: 'Digite a cidade',
      scope: 'Alcance',
      scopeLocal: 'Local',
      scopeNational: 'Nacional',
      scopeInternational: 'Internacional',
      scopeLocalHelp: 'Apenas participantes da mesma cidade',
      scopeNationalHelp: 'Participantes de todo o país',
      scopeInternationalHelp: 'Participantes de qualquer lugar',
      handlesShipping: 'Ofereço envio do prêmio',
      handlesShippingDesc: 'O prêmio será entregue ao ganhador'
    },
    step2: {
      title: 'Elementos',
      label: 'Elementos da Rifa',
      description: 'Configure os números ou elementos da rifa',
      quantity: 'Quantidade de {elements}:',
      quantityPlaceholder: 'Quantidade de {elements}',
      help: {
        default: 'Defina quantos elementos terá sua rifa',
        deck: 'O baralho tem 52 cartas + 2 coringas',
        alphabet: 'O alfabeto tem 26 letras',
        animals: 'O zodíaco chinês tem 12 animais',
        colors: 'Você pode personalizar as cores',
        teams: 'Você pode personalizar os times',
        emojis: 'Você pode escolher os emojis'
      },
      editElements: 'Edite os {elements} abaixo',
      deleteElement: 'Excluir elemento',
      availableColors: 'Cores Disponíveis',
      colorHelp: 'Clique em uma cor para adicionar à rifa'
    },
    step3: {
      title: 'Prêmios',
      label: 'Prêmios da Rifa',
      description: 'Configure o prêmio principal e seus detalhes',
      prizes: 'Prêmios',
      addPrize: 'Adicionar Prêmio',
      noPrizes: 'Nenhum prêmio adicionado',
      rules: 'Regras da Rifa',
      rulesPlaceholder: 'Defina as regras da rifa...'
    },
    step4: {
      title: 'Finalizar',
      label: 'Sorteio e Pagamento',
      description: 'Configure como será o sorteio e os métodos de pagamento',
      liveDraw: 'Sorteio ao Vivo',
      liveDrawRequired: 'O sorteio ao vivo é obrigatório para transparência',
      drawDate: 'Data do Sorteio',
      platform: 'Plataforma de Transmissão',
      selectPlatform: 'Selecione uma plataforma',
      platforms: {
        facebook: 'Facebook',
        instagram: 'Instagram',
        youtube: 'YouTube',
        zoom: 'Zoom',
        other: 'Outra'
      },
      specifyPlatform: 'Especifique a plataforma',
      platformNamePlaceholder: 'Nome da plataforma',
      streamLink: 'Link da Transmissão',
      streamLinkPlaceholder: 'https://...',
      drawMethod: 'Método de Sorteio',
      selectMethod: 'Selecione um método',
      methods: {
        roulette: 'Roleta',
        balls: 'Bolas numeradas',
        app: 'App de sorteio',
        other: 'Outro'
      },
      witnesses: 'Testemunhas',
      witnessesPlaceholder: 'Nome das testemunhas (opcional)',
      paymentData: 'Dados Bancários',
      paymentDataDesc: 'Informe os dados onde você receberá os pagamentos',
      bankData: 'Dados Bancários',
      clabe: 'CLABE',
      clabePlaceholder: '18 dígitos',
      clabeHelp: 'Sua CLABE interbancária',
      accountNumber: 'Número da Conta',
      accountNumberPlaceholder: 'Número da conta',
      bankName: 'Nome do Banco',
      bankNamePlaceholder: 'Ex: BBVA, Santander, etc.',
      accountHolder: 'Nome do Titular',
      accountHolderPlaceholder: 'Nome completo',
      phone: 'Telefone',
      phonePlaceholder: '(11) 99999-9999',
      whatsapp: 'WhatsApp',
      whatsappPlaceholder: '(11) 99999-9999',
      whatsappHelp: 'Para contato com os participantes',
      paymentInfo: 'Os participantes farão o pagamento para estes dados',
      terms: 'Termos e Condições',
      termsConfirm: 'Ao criar uma rifa, você confirma que:',
      termsList: {
        nonProfit: 'A rifa é sem fins lucrativos ou está devidamente autorizada',
        liveDraw: 'O sorteio será realizado ao vivo e transmitido publicamente',
        deliverPrizes: 'Os prêmios serão entregues conforme descrito',
        transparency: 'Toda a arrecadação será transparente',
        commission: 'A plataforma cobra uma comissão de até 6.5%'
      },
      acceptTerms: 'Aceito os termos e condições',
      readTerms: 'Ler termos completos'
    },
    success: {
      title: 'Rifa criada com sucesso!',
      message: 'Sua rifa foi criada e já está disponível para participantes.',
      manage: 'Gerenciar Agora',
      goHome: 'Ir para o Início',
      redirecting: 'Redirecionando para gerenciamento...'
    }
  },
  rifaManagement: {
    header: {
      title: 'Gerenciar Rifa:',
      updateData: 'Atualizar Dados',
      deleteRifa: 'Excluir Rifa',
      back: 'Voltar'
    },
    share: {
      title: 'Compartilhar Rifa',
      downloadQR: 'Baixar QR Code'
    },
    sell: {
      title: 'Vender Números',
      participantName: 'Nome do Participante',
      participantNamePlaceholder: 'Digite o nome completo',
      phone: 'Telefone',
      phonePlaceholder: '(11) 99999-9999',
      email: 'Email',
      emailPlaceholder: 'email@exemplo.com',
      selectedNumbers: 'Números Selecionados:',
      sellNumbers: 'Vender Números',
      multipleSale: 'Venda Múltipla',
      numberStates: {
        sold: 'Vendido',
        reserved: 'Reservado',
        available: 'Disponível'
      }
    },
    stats: {
      title: 'Estatísticas',
      totalNumbers: 'Total de Números',
      sold: 'Vendidos',
      available: 'Disponíveis',
      reserved: 'Reservados',
      participants: 'Participantes',
      collected: 'Arrecadado'
    },
    result: {
      title: 'Resultado da Rifa',
      winnerNumber: 'Número Ganador',
      winnerNumberPlaceholder: 'Digite o número ganador',
      publishResult: 'Publicar resultado',
      saveResult: 'Salvar resultado',
      published: 'Resultado publicado?',
      currentNumber: 'Número atual',
      yes: 'Sim',
      no: 'Não'
    },
    prizes: {
      title: 'Prêmios'
    },
    photos: {
      title: 'Fotos',
      noPhotos: 'Nenhuma foto adicionada',
      noPhotosHelp: 'Adicione fotos dos prêmios para tornar sua rifa mais atrativa'
    },
    rules: {
      title: 'Regras'
    },
    payment: {
      title: 'Formas de Pagamento',
      edit: 'Editar',
      cancel: 'Cancelar',
      save: 'Salvar',
      cancelButton: 'Cancelar',
      bankData: 'Dados Bancários',
      bank: 'Banco',
      bankPlaceholder: 'Nome do banco',
      clabe: 'CLABE',
      clabePlaceholder: '18 dígitos',
      accountNumber: 'Número da conta',
      accountNumberPlaceholder: 'Número da conta',
      holderName: 'Nome do titular',
      holderNamePlaceholder: 'Nome completo',
      phone: 'Telefone',
      phonePlaceholder: '(11) 99999-9999',
      whatsapp: 'WhatsApp',
      whatsappPlaceholder: '(11) 99999-9999',
      whatsappHelp: 'Para contato com os participantes',
      otherDetails: 'Outros detalhes',
      otherDetailsPlaceholder: 'Informações adicionais...',
      notConfigured: 'Nenhuma forma de pagamento configurada',
      notConfiguredHelp: 'Clique em "Editar" para configurar os dados bancários',
      notSpecified: 'Não especificado'
    },
    participants: {
      title: 'Participantes',
      pending: 'Pendentes',
      confirmed: 'Confirmados',
      none: 'Nenhum participante registrado',
      noPending: 'Todos os participantes foram confirmados',
      viewAll: 'Ver todos os participantes',
      phone: 'Telefone:',
      numbers: 'Números:',
      total: 'Total:',
      date: 'Data:',
      notSpecified: 'Não especificado',
      actions: {
        confirmSale: 'Confirmar Venda',
        reject: 'Rejeitar',
        confirmSaleTitle: 'Confirmar venda',
        rejectTitle: 'Rejeitar pagamento'
      },
      status: {
        confirmed: 'Confirmado',
        pending: 'Pendente'
      }
    },
    saleModal: {
      title: 'Venda de Números',
      close: 'Fechar',
      saleType: 'Tipo de Venda',
      individual: 'Individual ({count} números para 1 participante)',
      multiple: 'Múltipla ({count} números para {count} participantes)',
      sameName: 'Mesmo nome para todos os participantes',
      nameForAll: 'Nome para todos',
      nameForAllPlaceholder: 'Digite o nome',
      participantsList: 'Lista de Participantes ({count})',
      participantNumber: 'Números:',
      participantName: 'Nome do participante',
      participantPhone: 'Telefone',
      summary: {
        title: 'Resumo da Venda',
        totalParticipants: 'Total de participantes:',
        totalNumbers: 'Total de números:',
        totalToCharge: 'Total a cobrar:'
      },
      cancel: 'Cancelar',
      processSale: 'Processar Venda'
    },
    alerts: {
      deleteRifa: {
        title: 'Excluir Rifa',
        message: 'Tem certeza que deseja excluir "{name}"?',
        confirm: 'Sim, excluir',
        cancel: 'Cancelar'
      },
      deleteSuccess: {
        title: 'Rifa Excluída!',
        message: 'A rifa foi excluída com sucesso'
      },
      deleteError: {
        title: 'Erro ao Excluir',
        message: 'Ocorreu um erro ao excluir a rifa',
        sessionExpired: 'Sessão expirada',
        noPermissions: 'Sem permissão',
        noPermissionsMessage: 'Você não tem permissão para excluir esta rifa',
        notFound: 'Rifa não encontrada',
        notFoundMessage: 'A rifa não existe ou já foi excluída'
      },
      resultUpdated: {
        title: 'Resultado Atualizado!',
        message: 'O resultado da rifa foi publicado com sucesso'
      },
      resultError: {
        title: 'Erro ao Salvar',
        message: 'Ocorreu um erro ao salvar o resultado'
      },
      saleConfirmed: {
        title: 'Venda Confirmada!',
        message: 'A venda foi confirmada com sucesso'
      },
      confirmError: {
        title: 'Erro ao Confirmar',
        message: 'Ocorreu um erro ao confirmar a venda',
        unknown: 'Erro desconhecido'
      },
      paymentSaved: {
        title: 'Formas de Pagamento Salvas!',
        message: 'As formas de pagamento foram atualizadas com sucesso'
      },
      paymentError: {
        title: 'Erro ao Salvar',
        message: 'Ocorreu um erro ao salvar as formas de pagamento',
        unknown: 'Erro desconhecido'
      },
      directSaleSuccess: {
        title: 'Venda Realizada!',
        message: '{count} números vendidos para {name} por {total}',
        multipleParticipants: '{count} participantes registrados com sucesso'
      },
      saleError: {
        title: 'Erro na Venda',
        message: 'Ocorreu um erro ao processar a venda',
        unknown: 'Erro desconhecido',
        noneProcessed: 'Nenhuma venda foi processada'
      },
      selectNumbers: {
        title: 'Selecione Números',
        message: 'Selecione pelo menos um número para vender'
      },
      nameRequired: {
        title: 'Nome Obrigatório',
        message: 'Digite o nome do participante',
        allRequired: 'Todos os participantes devem ter nome'
      },
      confirmSale: {
        title: 'Confirmar Venda',
        message: 'Tem certeza que deseja confirmar esta venda?',
        confirm: 'Confirmar',
        cancel: 'Cancelar'
      }
    },
    notFound: {
      title: 'Rifa não encontrada',
      backToDashboard: 'Voltar ao Dashboard',
      backToHome: 'Voltar para o início'
    }
  },
  publicRifaView: {
    payment: {
      bank: 'Banco',
      clabe: 'CLABE',
      accountNumber: 'Número da conta',
      holder: 'Titular',
      phone: 'Telefone',
      whatsapp: 'WhatsApp'
    }
  },
  footer: {
    tagline: 'Sua chance de ganhar prêmios incríveis',
    description: 'Participe de rifas online seguras e concorra a prêmios que mudam vidas.',
    copyright: 'Todos os direitos reservados',
    productOf: 'Produto de GranaFácil',
    paymentInfo: 'Pagamento 100% seguro via',
    sections: {
      product: 'Produto',
      resources: 'Recursos',
      legal: 'Legal',
      contact: 'Contato'
    },
    links: {
      features: 'Funcionalidades',
      pricing: 'Preços',
      demo: 'Demonstração',
      api: 'API',
      help: 'Ajuda',
      docs: 'Documentação',
      tutorials: 'Tutoriais',
      blog: 'Blog',
      terms: 'Termos de Uso',
      privacy: 'Política de Privacidade',
      cookies: 'Política de Cookies',
      legal: 'Aviso Legal',
      support: 'Suporte',
      sales: 'Vendas'
    }
  }
};

// Traducciones en español
const translationES = {
  common: {
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    back: 'Volver',
    confirm: 'Confirmar'
  },
  nav: {
    home: 'Inicio',
    createRaffle: 'Crear Rifa',
    viewRaffles: 'Ver Rifas',
    checkWinners: 'Consultar Ganadores',
    forAdvertisers: 'Anunciantes',
    hello: 'Hola',
    admin: 'Administrador',
    guest: 'Invitado',
    logout: 'Salir',
    menu: 'Menú',
    myPortal: 'Mi Portal',
    settings: 'Configuración'
  },
  landing: {
    subtitle: 'Tu oportunidad de transformar sueños en realidad',
    description: 'Crea, comparte y participa en rifas online de forma segura y transparente.',
    createAccount: 'Crear mi cuenta',
    iAmAdvertiser: 'Soy Anunciante',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    login: 'Iniciar sesión',
    heroCard: {
      activeRaffle: 'Rifa destacada',
      available: 'Disponibles',
      daysRemaining: 'Días restantes',
      pricePerTicket: 'Valor del boleto',
      viewRaffle: 'Ver rifa',
      loading: 'Cargando...',
      loadingRaffles: 'Cargando rifas...',
      comingSoon: 'Próximamente'
    }
  },
  features: {
    title: '¿Por qué elegir GranaFácil?',
    subtitle: 'Todo lo que necesitas para participar en rifas profesionales de forma simple y segura.',
    items: {
      customizable: {
        title: 'Participación Fácil',
        description: 'Elige tus números favoritos y compite por premios increíbles en pocos clics.'
      },
      multipleTypes: {
        title: 'Pago Seguro',
        description: 'Paga con PIX, tarjeta de crédito o transferencia bancaria con total seguridad.'
      },
      securePayments: {
        title: 'Sorteos Transparentes',
        description: 'Sigue los sorteos en vivo con total transparencia y credibilidad.'
      },
      transparency: {
        title: '100% Responsivo',
        description: 'Participa desde cualquier lugar, directo desde tu celular, tablet o computadora.'
      },
      management: {
        title: 'Notificaciones en Tiempo Real',
        description: 'Recibe alertas sobre nuevos sorteos y resultados directamente en tu email.'
      },
      unlimitedReach: {
        title: 'Premios Increíbles',
        description: 'Compite por premios que cambian vidas: iPhones, TVs, viajes y mucho más.'
      }
    },
    benefits: {
      title: 'Ventajas de participar con GranaFácil',
      reduceCosts: {
        title: 'Premios Valiosos',
        description: 'Rifas con premios exclusivos y de alto valor.'
      },
      credibility: {
        title: 'Credibilidad',
        description: 'Sorteos en vivo y resultados verificables.'
      },
      scalable: {
        title: 'Seguimiento Fácil',
        description: 'Sigue tus números y sorteos en un solo lugar.'
      },
      totalControl: {
        title: 'Diversión Garantizada',
        description: 'La emoción de competir por premios increíbles.'
      }
    }
  },
  howItWorks: {
    title: 'Cómo Funciona',
    steps: {
      register: {
        title: 'Regístrate',
        description: 'Crea tu cuenta gratis en menos de 1 minuto.'
      },
      create: {
        title: 'Elige tu rifa',
        description: 'Navega por las rifas disponibles y elige tus números de la suerte.'
      },
      share: {
        title: 'Paga con seguridad',
        description: 'Realiza el pago vía PIX, tarjeta o transferencia.'
      },
      draw: {
        title: 'Sigue el sorteo',
        description: 'Mira el sorteo en vivo y comprueba si eres el ganador.'
      }
    }
  },
  about: {
    title: 'Sobre nosotros',
    description1: 'es una plataforma profesional para rifas online.',
    description2: 'Ofrecemos seguridad, transparencia y herramientas completas para tus sorteos.',
    forWhoTitle: '¿Para quién es GranaFácil?',
    audience: {
      entrepreneurs: {
        title: 'Emprendedores',
        description: 'Crea rifas para impulsar tu negocio.'
      },
      nonprofit: {
        title: 'ONGs',
        description: 'Recauda fondos para causas importantes.'
      },
      businesses: {
        title: 'Empresas',
        description: 'Realiza acciones promocionales increíbles.'
      },
      professionals: {
        title: 'Influencers',
        description: 'Engancha a tu audiencia con rifas exclusivas.'
      }
    }
  },
  cta: {
    title: '¿Listo para participar?',
    subtitle: 'Únete a miles de personas que ya hacen realidad sus sueños con GranaFácil.',
    button: 'Crear mi cuenta'
  },
  advertisersSection: {
    title: 'Anuncia en GranaFácil',
    subtitle: 'Alcanza miles de participantes en todo Brasil',
    primaryButton: 'Anunciar ahora',
    secondaryButton: 'Saber más'
  },
  plans: {
    title: 'Planes para Creadores',
    subtitle: 'Elige el plan ideal para tus rifas',
    perMonth: '/mes',
    elementsPerRaffle: 'Elementos por rifa',
    currentPlan: 'Plan actual',
    choosePlan: 'Elegir plan',
    features: {
      '1RifaActiva': '1 rifa activa',
      '10RifasActivas': '10 rifas activas',
      rifasIlimitadas: 'Rifas ilimitadas',
      comision65: 'Comisión 6.5%',
      comision55: 'Comisión 5.5%',
      comision45: 'Comisión 4.5%',
      pagoSeguroStripe: 'Pago seguro con Stripe',
      whatsappParticipantes: 'WhatsApp para participantes',
      soporteEmail: 'Soporte por email',
      soportePrioritario: 'Soporte prioritario',
      soporteDedicado: 'Soporte dedicado',
      estadisticasDetalladas: 'Estadísticas detalladas',
      estadisticasAvanzadas: 'Estadísticas avanzadas',
      gestionParticipantes: 'Gestión de participantes'
    }
  },
  wizard: {
    title: 'Crear Nueva Rifa',
    subtitle: 'Completa los datos para crear tu rifa profesional',
    required: 'Obligatorio',
    optional: 'Opcional',
    actions: {
      back: 'Volver',
      next: 'Continuar',
      create: 'Crear Rifa',
      mustAcceptTerms: 'Debes aceptar los términos para crear la rifa'
    },
    step1: {
      title: 'Información',
      label: 'Información Básica',
      stepDescription: 'Define los datos principales de tu rifa',
      raffleName: 'Nombre de la Rifa',
      raffleNamePlaceholder: 'Ej: iPhone 15 Pro Max',
      raffleNameHelp: 'Elige un nombre atractivo para tu rifa',
      description: 'Descripción',
      descriptionPlaceholder: 'Describe los premios, cómo funcionará el sorteo...',
      descriptionHelp: 'Detalla los premios y las reglas principales',
      raffleType: 'Tipo de Rifa',
      types: {
        numbers: 'Números',
        deck: 'Baraja',
        alphabet: 'Abecedario',
        animals: 'Animales',
        colors: 'Colores',
        teams: 'Equipos',
        emojis: 'Emojis',
        countries: 'Países'
      },
      pricePerElement: 'Precio por {element}',
      pricePlaceholder: '10.00',
      priceHelp: 'Valor que pagará cada participante por {element}',
      category: 'Categoría',
      categoryPlaceholder: 'Selecciona una categoría',
      categories: {
        properties: 'Inmuebles',
        vehicles: 'Vehículos',
        technology: 'Tecnología',
        experiences: 'Experiencias',
        sports: 'Deportes',
        jewellery: 'Joyería',
        travel: 'Viajes',
        fashion: 'Moda',
        food: 'Alimentos',
        health: 'Salud',
        kids: 'Infantil',
        cash: 'Efectivo',
        other: 'Otros'
      },
      categoryHelp: 'Selecciona la categoría del premio principal',
      visibility: 'Visibilidad',
      public: 'Pública',
      publicDesc: 'Visible para todos los participantes',
      private: 'Privada',
      privateDesc: 'Solo con enlace directo',
      endDate: 'Fecha de cierre',
      endDateHelp: 'Fecha límite para participar',
      location: 'Ubicación',
      locationDesc: 'Informa la ubicación de la rifa',
      country: 'País',
      selectCountry: 'Selecciona un país',
      state: 'Estado',
      selectState: 'Selecciona un estado',
      city: 'Ciudad',
      cityPlaceholder: 'Escribe la ciudad',
      scope: 'Alcance',
      scopeLocal: 'Local',
      scopeNational: 'Nacional',
      scopeInternational: 'Internacional',
      scopeLocalHelp: 'Solo participantes de la misma ciudad',
      scopeNationalHelp: 'Participantes de todo el país',
      scopeInternationalHelp: 'Participantes de cualquier lugar',
      handlesShipping: 'Ofrezco envío del premio',
      handlesShippingDesc: 'El premio será entregado al ganador'
    },
    step2: {
      title: 'Elementos',
      label: 'Elementos de la Rifa',
      description: 'Configura los números o elementos de la rifa',
      quantity: 'Cantidad de {elements}:',
      quantityPlaceholder: 'Cantidad de {elements}',
      help: {
        default: 'Define cuántos elementos tendrá tu rifa',
        deck: 'La baraja tiene 52 cartas + 2 comodines',
        alphabet: 'El abecedario tiene 26 letras',
        animals: 'El zodiaco chino tiene 12 animales',
        colors: 'Puedes personalizar los colores',
        teams: 'Puedes personalizar los equipos',
        emojis: 'Puedes elegir los emojis'
      },
      editElements: 'Edita los {elements} abajo',
      deleteElement: 'Eliminar elemento',
      availableColors: 'Colores Disponibles',
      colorHelp: 'Haz clic en un color para añadirlo a la rifa'
    },
    step3: {
      title: 'Premios',
      label: 'Premios de la Rifa',
      description: 'Configura el premio principal y sus detalles',
      prizes: 'Premios',
      addPrize: 'Agregar Premio',
      noPrizes: 'No hay premios agregados',
      rules: 'Reglas de la Rifa',
      rulesPlaceholder: 'Define las reglas de la rifa...'
    },
    step4: {
      title: 'Finalizar',
      label: 'Sorteo y Pago',
      description: 'Configura cómo será el sorteo y los métodos de pago',
      liveDraw: 'Sorteo en Vivo',
      liveDrawRequired: 'El sorteo en vivo es obligatorio para transparencia',
      drawDate: 'Fecha del Sorteo',
      platform: 'Plataforma de Transmisión',
      selectPlatform: 'Selecciona una plataforma',
      platforms: {
        facebook: 'Facebook',
        instagram: 'Instagram',
        youtube: 'YouTube',
        zoom: 'Zoom',
        other: 'Otra'
      },
      specifyPlatform: 'Especifica la plataforma',
      platformNamePlaceholder: 'Nombre de la plataforma',
      streamLink: 'Enlace de Transmisión',
      streamLinkPlaceholder: 'https://...',
      drawMethod: 'Método de Sorteo',
      selectMethod: 'Selecciona un método',
      methods: {
        roulette: 'Ruleta',
        balls: 'Bolas numeradas',
        app: 'App de sorteo',
        other: 'Otro'
      },
      witnesses: 'Testigos',
      witnessesPlaceholder: 'Nombre de los testigos (opcional)',
      paymentData: 'Datos Bancarios',
      paymentDataDesc: 'Informa los datos donde recibirás los pagos',
      bankData: 'Datos Bancarios',
      clabe: 'CLABE',
      clabePlaceholder: '18 dígitos',
      clabeHelp: 'Tu CLABE interbancaria',
      accountNumber: 'Número de Cuenta',
      accountNumberPlaceholder: 'Número de cuenta',
      bankName: 'Nombre del Banco',
      bankNamePlaceholder: 'Ej: BBVA, Santander, etc.',
      accountHolder: 'Nombre del Titular',
      accountHolderPlaceholder: 'Nombre completo',
      phone: 'Teléfono',
      phonePlaceholder: '(11) 99999-9999',
      whatsapp: 'WhatsApp',
      whatsappPlaceholder: '(11) 99999-9999',
      whatsappHelp: 'Para contacto con los participantes',
      paymentInfo: 'Los participantes harán el pago a estos datos',
      terms: 'Términos y Condiciones',
      termsConfirm: 'Al crear una rifa, confirmas que:',
      termsList: {
        nonProfit: 'La rifa es sin fines de lucro o está debidamente autorizada',
        liveDraw: 'El sorteo se realizará en vivo y se transmitirá públicamente',
        deliverPrizes: 'Los premios se entregarán según lo descrito',
        transparency: 'Toda la recaudación será transparente',
        commission: 'La plataforma cobra una comisión de hasta 6.5%'
      },
      acceptTerms: 'Acepto los términos y condiciones',
      readTerms: 'Leer términos completos'
    },
    success: {
      title: '¡Rifa creada con éxito!',
      message: 'Tu rifa ha sido creada y ya está disponible para participantes.',
      manage: 'Gestionar Ahora',
      goHome: 'Ir al Inicio',
      redirecting: 'Redirigiendo a gestión...'
    }
  },
  rifaManagement: {
    header: {
      title: 'Gestionar Rifa:',
      updateData: 'Actualizar Datos',
      deleteRifa: 'Eliminar Rifa',
      back: 'Volver'
    },
    share: {
      title: 'Compartir Rifa',
      downloadQR: 'Descargar QR Code'
    },
    sell: {
      title: 'Vender Números',
      participantName: 'Nombre del Participante',
      participantNamePlaceholder: 'Escribe el nombre completo',
      phone: 'Teléfono',
      phonePlaceholder: '(11) 99999-9999',
      email: 'Email',
      emailPlaceholder: 'email@ejemplo.com',
      selectedNumbers: 'Números Seleccionados:',
      sellNumbers: 'Vender Números',
      multipleSale: 'Venta Múltiple',
      numberStates: {
        sold: 'Vendido',
        reserved: 'Reservado',
        available: 'Disponible'
      }
    },
    stats: {
      title: 'Estadísticas',
      totalNumbers: 'Total de Números',
      sold: 'Vendidos',
      available: 'Disponibles',
      reserved: 'Reservados',
      participants: 'Participantes',
      collected: 'Recaudado'
    },
    result: {
      title: 'Resultado de la Rifa',
      winnerNumber: 'Número Ganador',
      winnerNumberPlaceholder: 'Escribe el número ganador',
      publishResult: 'Publicar resultado',
      saveResult: 'Guardar resultado',
      published: '¿Resultado publicado?',
      currentNumber: 'Número actual',
      yes: 'Sí',
      no: 'No'
    },
    prizes: {
      title: 'Premios'
    },
    photos: {
      title: 'Fotos',
      noPhotos: 'No hay fotos añadidas',
      noPhotosHelp: 'Añade fotos de los premios para hacer tu rifa más atractiva'
    },
    rules: {
      title: 'Reglas'
    },
    payment: {
      title: 'Formas de Pago',
      edit: 'Editar',
      cancel: 'Cancelar',
      save: 'Guardar',
      cancelButton: 'Cancelar',
      bankData: 'Datos Bancarios',
      bank: 'Banco',
      bankPlaceholder: 'Nombre del banco',
      clabe: 'CLABE',
      clabePlaceholder: '18 dígitos',
      accountNumber: 'Número de cuenta',
      accountNumberPlaceholder: 'Número de cuenta',
      holderName: 'Nombre del titular',
      holderNamePlaceholder: 'Nombre completo',
      phone: 'Teléfono',
      phonePlaceholder: '(11) 99999-9999',
      whatsapp: 'WhatsApp',
      whatsappPlaceholder: '(11) 99999-9999',
      whatsappHelp: 'Para contacto con los participantes',
      otherDetails: 'Otros detalles',
      otherDetailsPlaceholder: 'Información adicional...',
      notConfigured: 'No hay formas de pago configuradas',
      notConfiguredHelp: 'Haz clic en "Editar" para configurar los datos bancarios',
      notSpecified: 'No especificado'
    },
    participants: {
      title: 'Participantes',
      pending: 'Pendientes',
      confirmed: 'Confirmados',
      none: 'No hay participantes registrados',
      noPending: 'Todos los participantes han sido confirmados',
      viewAll: 'Ver todos los participantes',
      phone: 'Teléfono:',
      numbers: 'Números:',
      total: 'Total:',
      date: 'Fecha:',
      notSpecified: 'No especificado',
      actions: {
        confirmSale: 'Confirmar Venta',
        reject: 'Rechazar',
        confirmSaleTitle: 'Confirmar venta',
        rejectTitle: 'Rechazar pago'
      },
      status: {
        confirmed: 'Confirmado',
        pending: 'Pendiente'
      }
    },
    saleModal: {
      title: 'Venta de Números',
      close: 'Cerrar',
      saleType: 'Tipo de Venta',
      individual: 'Individual ({count} números para 1 participante)',
      multiple: 'Múltiple ({count} números para {count} participantes)',
      sameName: 'Mismo nombre para todos los participantes',
      nameForAll: 'Nombre para todos',
      nameForAllPlaceholder: 'Escribe el nombre',
      participantsList: 'Lista de Participantes ({count})',
      participantNumber: 'Números:',
      participantName: 'Nombre del participante',
      participantPhone: 'Teléfono',
      summary: {
        title: 'Resumen de la Venta',
        totalParticipants: 'Total de participantes:',
        totalNumbers: 'Total de números:',
        totalToCharge: 'Total a cobrar:'
      },
      cancel: 'Cancelar',
      processSale: 'Procesar Venta'
    },
    alerts: {
      deleteRifa: {
        title: 'Eliminar Rifa',
        message: '¿Estás seguro que deseas eliminar "{name}"?',
        confirm: 'Sí, eliminar',
        cancel: 'Cancelar'
      },
      deleteSuccess: {
        title: '¡Rifa Eliminada!',
        message: 'La rifa ha sido eliminada con éxito'
      },
      deleteError: {
        title: 'Error al Eliminar',
        message: 'Ocurrió un error al eliminar la rifa',
        sessionExpired: 'Sesión expirada',
        noPermissions: 'Sin permiso',
        noPermissionsMessage: 'No tienes permiso para eliminar esta rifa',
        notFound: 'Rifa no encontrada',
        notFoundMessage: 'La rifa no existe o ya fue eliminada'
      },
      resultUpdated: {
        title: '¡Resultado Actualizado!',
        message: 'El resultado de la rifa ha sido publicado con éxito'
      },
      resultError: {
        title: 'Error al Guardar',
        message: 'Ocurrió un error al guardar el resultado'
      },
      saleConfirmed: {
        title: '¡Venta Confirmada!',
        message: 'La venta ha sido confirmada con éxito'
      },
      confirmError: {
        title: 'Error al Confirmar',
        message: 'Ocurrió un error al confirmar la venta',
        unknown: 'Error desconocido'
      },
      paymentSaved: {
        title: '¡Formas de Pago Guardadas!',
        message: 'Las formas de pago han sido actualizadas con éxito'
      },
      paymentError: {
        title: 'Error al Guardar',
        message: 'Ocurrió un error al guardar las formas de pago',
        unknown: 'Error desconocido'
      },
      directSaleSuccess: {
        title: '¡Venta Realizada!',
        message: '{count} números vendidos a {name} por {total}',
        multipleParticipants: '{count} participantes registrados con éxito'
      },
      saleError: {
        title: 'Error en la Venta',
        message: 'Ocurrió un error al procesar la venta',
        unknown: 'Error desconocido',
        noneProcessed: 'Ninguna venta fue procesada'
      },
      selectNumbers: {
        title: 'Selecciona Números',
        message: 'Selecciona al menos un número para vender'
      },
      nameRequired: {
        title: 'Nombre Obligatorio',
        message: 'Escribe el nombre del participante',
        allRequired: 'Todos los participantes deben tener nombre'
      },
      confirmSale: {
        title: 'Confirmar Venta',
        message: '¿Estás seguro que deseas confirmar esta venta?',
        confirm: 'Confirmar',
        cancel: 'Cancelar'
      }
    },
    notFound: {
      title: 'Rifa no encontrada',
      backToDashboard: 'Volver al Dashboard',
      backToHome: 'Volver al inicio'
    }
  },
  publicRifaView: {
    payment: {
      bank: 'Banco',
      clabe: 'CLABE',
      accountNumber: 'Número de cuenta',
      holder: 'Titular',
      phone: 'Teléfono',
      whatsapp: 'WhatsApp'
    }
  },
  footer: {
    tagline: 'Tu oportunidad de ganar premios increíbles',
    description: 'Participa en rifas online seguras y compite por premios que cambian vidas.',
    copyright: 'Todos los derechos reservados',
    productOf: 'Producto de GranaFácil',
    paymentInfo: 'Pago 100% seguro vía',
    sections: {
      product: 'Producto',
      resources: 'Recursos',
      legal: 'Legal',
      contact: 'Contacto'
    },
    links: {
      features: 'Funcionalidades',
      pricing: 'Precios',
      demo: 'Demostración',
      api: 'API',
      help: 'Ayuda',
      docs: 'Documentación',
      tutorials: 'Tutoriales',
      blog: 'Blog',
      terms: 'Términos de Uso',
      privacy: 'Política de Privacidad',
      cookies: 'Política de Cookies',
      legal: 'Aviso Legal',
      support: 'Soporte',
      sales: 'Ventas'
    }
  }
};

// Inicializar i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: translationPT },
      es: { translation: translationES }
    },
    fallbackLng: 'pt',
    lng: localStorage.getItem('language') || 'pt',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;