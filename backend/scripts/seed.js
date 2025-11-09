import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import slugify from 'slugify';

// Configuração de ambiente para carregar .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

/**
 * Dados de Seeding: 20 Categorias, 10 Subcategorias por Categoria e 5 Tags por Subcategoria.
 * Os dados aqui refletem a estrutura de busca popular que definimos anteriormente.
 */
const SEED_DATA = [
  // 1. Tecnologia
  {
    title: 'Tecnologia', icon: 'code', description: 'Cursos sobre desenvolvimento, dados e infraestrutura.',
    subcategories: [
      { title: 'Desenvolvimento Web', tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Backend'], icon: 'web' },
      { title: 'Inteligência Artificial (IA)', tags: ['Machine Learning', 'Deep Learning', 'ChatGPT', 'Automação', 'Algoritmos'], icon: 'robot' },
      { title: 'Análise de Dados', tags: ['Python', 'SQL', 'Estatística', 'Big Data', 'Power BI'], icon: 'analytics' },
      { title: 'Cibersegurança', tags: ['Hacking Ético', 'Teste de Penetração', 'Segurança de Redes', 'LGPD', 'Firewall'], icon: 'security' },
      { title: 'Desenvolvimento Mobile', tags: ['Android', 'iOS', 'Flutter', 'React Native', 'Swift'], icon: 'smartphone' },
      { title: 'Computação em Nuvem', tags: ['AWS', 'Azure', 'Google Cloud', 'DevOps', 'Kubernetes'], icon: 'cloud' },
      { title: 'Lógica de Programação', tags: ['Estrutura de Dados', 'Algoritmos', 'Resolução de Problemas', 'Pensamento Computacional', 'Fluxograma'], icon: 'settings_ethernet' },
      { title: 'Blockchain e Criptomoedas', tags: ['Ethereum', 'Bitcoin', 'Web3', 'NFT', 'Contratos Inteligentes'], icon: 'currency_bitcoin' },
      { title: 'Design de Jogos', tags: ['Unity', 'Unreal Engine', 'Modelagem 3D', 'Narrativa', 'Game Design'], icon: 'sports_esports' },
      { title: 'Automação de Processos', tags: ['RPA', 'Fluxos de Trabalho', 'Macros', 'Otimização', 'Produtividade'], icon: 'automation' }
    ]
  },
  // 2. Marketing Digital
  {
    title: 'Marketing Digital', icon: 'campaign', description: 'Estratégias para presença online, vendas e branding.',
    subcategories: [
      { title: 'Mídias Sociais', tags: ['Instagram', 'TikTok', 'Estratégia', 'Criação de Conteúdo', 'Algoritmo'], icon: 'group' },
      { title: 'SEO (Otimização para Busca)', tags: ['Google', 'Palavras-chave', 'Tráfego Orgânico', 'Rankeamento', 'Conteúdo Web'], icon: 'search' },
      { title: 'Tráfego Pago', tags: ['Google Ads', 'Facebook Ads', 'Remarketing', 'Lançamento', 'Funil de Vendas'], icon: 'paid' },
      { title: 'E-mail Marketing', tags: ['Automação', 'Leads', 'Copywriting', 'Nutrição', 'Segmentação'], icon: 'email' },
      { title: 'Inbound Marketing', tags: ['Jornada do Cliente', 'Conteúdo de Valor', 'Atração', 'Conversão', 'Relacionamento'], icon: 'connect_without_contact' },
      { title: 'Marketing de Conteúdo', tags: ['Blog', 'Storytelling', 'Pauta', 'Edição', 'Engajamento'], icon: 'edit_note' },
      { title: 'Afiliados', tags: ['Hotmart', 'Nicho', 'Produto Digital', 'Comissão', 'Divulgação'], icon: 'people' },
      { title: 'Branding Pessoal', tags: ['Marca Pessoal', 'Autoridade', 'Posicionamento', 'Networking', 'Reputação'], icon: 'person' },
      { title: 'Análise de Métricas', tags: ['Google Analytics', 'KPIs', 'Relatórios', 'ROI', 'Decisão Baseada em Dados'], icon: 'data_usage' },
      { title: 'Copywriting', tags: ['Persuasão', 'Gatilhos Mentais', 'Títulos', 'Oferta', 'Chamada para Ação'], icon: 'auto_stories' }
    ]
  },
  // 3. Empreendedorismo
  {
    title: 'Empreendedorismo', icon: 'business_center', description: 'Cursos para abrir e gerir seu próprio negócio.',
    subcategories: [
      { title: 'Gestão Financeira', tags: ['Fluxo de Caixa', 'Orçamento', 'Precificação', 'Custos', 'Saúde Financeira'], icon: 'account_balance_wallet' },
      { title: 'Plano de Negócios', tags: ['Modelo de Negócios', 'MVP', 'Canvas', 'Análise SWOT', 'Viabilidade'], icon: 'assignment' },
      { title: 'Vendas e Negociação', tags: ['Prospecção', 'Fechamento', 'Objeções', 'Técnicas de Venda', 'SDR'], icon: 'handshake' },
      { title: 'E-commerce', tags: ['Plataformas', 'Logística', 'Meios de Pagamento', 'Gestão de Estoque', 'Marketplace'], icon: 'storefront' },
      { title: 'Liderança e Equipes', tags: ['Motivação', 'Delegação', 'Feedback', 'Cultura Organizacional', 'Gestão de Conflitos'], icon: 'diversity_3' },
      { title: 'Abertura de Empresa (MEI)', tags: ['Formalização', 'Impostos', 'Obrigações', 'Alvará', 'Nota Fiscal'], icon: 'badge' },
      { title: 'Inovação e Criatividade', tags: ['Brainstorming', 'Design Thinking', 'Solução de Problemas', 'Tendências', 'Geração de Ideias'], icon: 'lightbulb' },
      { title: 'Captação de Recursos', tags: ['Investimento Anjo', 'Crowdfunding', 'Financiamento', 'Pitch', 'Apresentação'], icon: 'trending_up' },
      { title: 'Gestão de Projetos', tags: ['Scrum', 'Metodologias Ágeis', 'Cronograma', 'Escopo', 'Riscos'], icon: 'date_range' },
      { title: 'Atendimento ao Cliente', tags: ['Sucesso do Cliente (CS)', 'CRM', 'Relacionamento', 'Retenção', 'Pós-venda'], icon: 'support_agent' }
    ]
  },
  // 4. Desenvolvimento Pessoal
  {
    title: 'Desenvolvimento Pessoal', icon: 'self_improvement', description: 'Cursos para aprimoramento de habilidades soft skills e bem-estar.',
    subcategories: [
      { title: 'Inteligência Emocional', tags: ['Autoconhecimento', 'Autocontrole', 'Empatia', 'Resiliência', 'Emoções'], icon: 'sentiment_satisfied' },
      { title: 'Produtividade', tags: ['Gestão do Tempo', 'Foco', 'Priorização', 'Hábitos', 'Metas'], icon: 'schedule' },
      { title: 'Comunicação e Oratória', tags: ['Falar em Público', 'Apresentação', 'Linguagem Corporal', 'Argumentação', 'Clareza'], icon: 'record_voice_over' },
      { title: 'Mindfulness e Meditação', tags: ['Atenção Plena', 'Redução de Estresse', 'Bem-estar', 'Relaxamento', 'Concentração'], icon: 'psychology' },
      { title: 'Habilidades de Estudo', tags: ['Leitura Dinâmica', 'Memorização', 'Mapas Mentais', 'Organização', 'Aprendizado Acelerado'], icon: 'school' },
      { title: 'Finanças Pessoais', tags: ['Educação Financeira', 'Investimentos (Iniciante)', 'Dívidas', 'Renda Extra', 'Planejamento'], icon: 'savings' },
      { title: 'Desenvolvimento de Carreira', tags: ['Currículo', 'Entrevista', 'Networking', 'Transição de Carreira', 'Propósito'], icon: 'work' },
      { title: 'Gestão do Estresse', tags: ['Rotina', 'Limites', 'Burnout', 'Equilíbrio', 'Saúde Mental'], icon: 'sick' },
      { title: 'Relacionamentos Interpessoais', tags: ['Família', 'Amizade', 'Comunicação Não-Violenta (CNV)', 'Conflitos', 'Socialização'], icon: 'people_alt' },
      { title: 'Criação de Hábitos', tags: ['Disciplina', 'Rotina Matinal', 'Autossabotagem', 'Motivação', 'Consistência'], icon: 'fitness_center' }
    ]
  },
  // 5. Arte e Cultura
  {
    title: 'Arte e Cultura', icon: 'palette', description: 'Aprenda técnicas de expressão visual e história da arte.',
    subcategories: [
      { title: 'Desenho', tags: ['Sketch', 'Perspectiva', 'Anatomia', 'Retrato', 'Mangá'], icon: 'brush' },
      { title: 'Pintura', tags: ['Aquarela', 'Óleo', 'Acrílico', 'Teoria das Cores', 'Tela'], icon: 'format_paint' },
      { title: 'Escultura', tags: ['Argila', 'Cerâmica', 'Modelagem 3D', 'Materiais', 'História da Arte'], icon: 'museum' },
      { title: 'História da Arte', tags: ['Períodos', 'Movimentos', 'Artistas', 'Crítica', 'Apreciação'], icon: 'article' },
      { title: 'Criação de Personagens', tags: ['Design de Personagem', 'Roteiro', 'Conceito', 'Expressões', 'Narrativa Visual'], icon: 'person_add' },
      { title: 'Caligrafia', tags: ['Lettering', 'Tipografia', 'Escrita Decorativa', 'Fontes', 'Tinta'], icon: 'edit' },
      { title: 'Arte Digital', tags: ['Ilustração', 'Photoshop', 'Procreate', 'Tablet Gráfico', 'Concept Art'], icon: 'camera_roll' },
      { title: 'Restauro', tags: ['Conservação', 'Materiais', 'Técnicas Antigas', 'Limpeza', 'Documentação'], icon: 'build' },
      { title: 'Curadoria', tags: ['Exposição', 'Coleção', 'Montagem', 'Conceito', 'Acervo'], icon: 'view_list' },
      { title: 'Desenho Arquitetônico', tags: ['Croqui', 'Plantas', 'Perspectiva', 'Escala', 'SketchUp'], icon: 'apartment' }
    ]
  },
  // 6. Áudio
  {
    title: 'Áudio', icon: 'headphones', description: 'Técnicas de gravação, produção e edição sonora.',
    subcategories: [
      { title: 'Produção Musical (Iniciante)', tags: ['DAW (Ableton, Logic)', 'Gravação', 'MIDI', 'Instrumentos Virtuais', 'Harmonia'], icon: 'tune' },
      { title: 'Edição de Áudio', tags: ['Limpeza', 'Normalização', 'Cortes', 'Softwares (Audacity)', 'Podcasts'], icon: 'content_cut' },
      { title: 'Mixagem', tags: ['Balanceamento', 'Efeitos', 'Compressão', 'Equalização', 'Referência'], icon: 'settings_mixer' },
      { title: 'Masterização', tags: ['Volume', 'Finalização', 'Limiter', 'Distribuição', 'Padrões'], icon: 'compress' },
      { title: 'Criação de Podcast', tags: ['Roteiro', 'Equipamento', 'Entrevista', 'Edição', 'Publicação'], icon: 'mic' },
      { title: 'Sonorização (Ao Vivo)', tags: ['Mesa de Som', 'Microfones', 'Acústica', 'Cabos', 'Monitoração'], icon: 'volume_up' },
      { title: 'Teoria Musical', tags: ['Notas', 'Escalas', 'Acordes', 'Ritmo', 'Leitura de Partitura'], icon: 'music_note' },
      { title: 'Trilha Sonora', tags: ['Cinema', 'Games', 'Efeitos Sonoros', 'Licenças', 'Composição'], icon: 'movie' },
      { title: 'Design de Som', tags: ['Foley', 'Efeitos', 'Ambientes', 'Manipulação', 'Soundscape'], icon: 'hearing' },
      { title: 'Locução e Dublagem', tags: ['Dicção', 'Interpretação', 'Equipamento', 'Estúdio', 'Vórtice'], icon: 'voice_over_off' }
    ]
  },
  // 7. Fotografia
  {
    title: 'Fotografia', icon: 'photo_camera', description: 'Dominando a arte de capturar imagens e a edição.',
    subcategories: [
      { title: 'Fundamentos', tags: ['Abertura', 'Velocidade', 'ISO', 'Exposição', 'Triângulo de Exposição'], icon: 'exposure' },
      { title: 'Retrato', tags: ['Iluminação', 'Poses', 'Expressão', 'Ambiente', 'Edição de Pele'], icon: 'portrait' },
      { title: 'Paisagem', tags: ['Composição', 'Horário Dourado', 'Longa Exposição', 'Filtros', 'Natureza'], icon: 'landscape' },
      { title: 'Edição (Lightroom)', tags: ['Presets', 'Cor', 'Contraste', 'Recorte', 'Organização de Arquivos'], icon: 'photo_filter' },
      { title: 'Edição (Photoshop)', tags: ['Camadas', 'Máscaras', 'Manipulação', 'Retoque Avançado', 'Seleção'], icon: 'layers' },
      { title: 'Fotografia Mobile', tags: ['Câmera do Celular', 'Aplicativos', 'Dicas', 'Composição', 'Luz Natural'], icon: 'camera_alt' },
      { title: 'Fotojornalismo', tags: ['Ética', 'Narrativa', 'Cobertura', 'Documentação', 'Momentos'], icon: 'public' },
      { title: 'Estúdio e Flash', tags: ['Luz Contínua', 'Flash Speedlight', 'Softbox', 'Snoot', 'Strobist'], icon: 'flash_on' },
      { title: 'Fotografia de Produtos', tags: ['Fundo Infinito', 'Iluminação', 'Detalhes', 'E-commerce', 'Flat Lay'], icon: 'shopping_bag' },
      { title: 'Composição Visual', tags: ['Regra dos Terços', 'Linhas', 'Padrões', 'Simetria', 'Enquadramento'], icon: 'grid_on' }
    ]
  },
  // 8. Casa e Jardim
  {
    title: 'Casa e Jardim', icon: 'home', description: 'Habilidades para o lar, culinária e pequenos reparos.',
    subcategories: [
      { title: 'Jardinagem (Iniciante)', tags: ['Plantio', 'Solo', 'Irrigação', 'Ferramentas', 'Cultivo'], icon: 'local_florist' },
      { title: 'Cozinha (Básica)', tags: ['Utensílios', 'Cortes', 'Temperos', 'Higiene', 'Receitas Fáceis'], icon: 'restaurant' },
      { title: 'Pequenos Reparos Domésticos', tags: ['Hidráulica (Vazamentos)', 'Elétrica (Tomadas)', 'Pintura', 'Ferramentas', 'Segurança'], icon: 'handyman' },
      { title: 'Organização Doméstica', tags: ['Desapego (Marie Kondo)', 'Rotina', 'Limpeza', 'Otimização de Espaço', 'Produtividade'], icon: 'format_list_bulleted' },
      { title: 'Hortas Urbanas', tags: ['Vasos', 'Compostagem', 'Plantas Comestíveis', 'Pragas', 'Sustentabilidade'], icon: 'eco' },
      { title: 'Decoração (DIY)', tags: ['Faça Você Mesmo', 'Materiais Reciclados', 'Artesanato', 'Estilos', 'Moodboard'], icon: 'auto_fix_normal' },
      { title: 'Costura (Iniciante)', tags: ['Máquina de Costura', 'Tipos de Ponto', 'Tecidos', 'Consertos', 'Modelagem Simples'], icon: 'content_cut' },
      { title: 'Maridagem (Manutenção Geral)', tags: ['Conserto de Eletrodomésticos', 'Montagem de Móveis', 'Ferramentas Elétricas', 'Dicas', 'Segurança'], icon: 'construction' },
      { title: 'Culinária Vegana', tags: ['Substituições', 'Receitas Sem Carne', 'Nutrição Vegetal', 'Ingredientes', 'Pratos Principais'], icon: 'spa' },
      { title: 'Plantas de Interior', tags: ['Cuidados', 'Iluminação', 'Tipos de Plantas', 'Umidade', 'Decoração'], icon: 'grass' }
    ]
  },
  // 9. Comunicação
  {
    title: 'Comunicação', icon: 'forum', description: 'Melhore sua escrita e a forma como interage com o mundo.',
    subcategories: [
      { title: 'Escrita Criativa', tags: ['Storytelling', 'Personagens', 'Diálogo', 'Gêneros Literários', 'Bloqueio Criativo'], icon: 'border_color' },
      { title: 'Copywriting (Conteúdo)', tags: ['Vendas', 'Persuasão', 'Headlines', 'Call to Action (CTA)', 'Estrutura'], icon: 'gavel' },
      { title: 'Oratória (Avançada)', tags: ['Gestão do Medo', 'Improviso', 'Conexão com Público', 'Voz', 'Linguagem Corporal'], icon: 'campaign' },
      { title: 'Redação Profissional', tags: ['E-mails', 'Relatórios', 'Documentos', 'Clareza', 'Gramática'], icon: 'description' },
      { title: 'Media Training', tags: ['Entrevistas', 'Crises', 'Postura', 'Mensagens-chave', 'Imagem Pública'], icon: 'tv' },
      { title: 'Comunicação Não-Violenta (CNV)', tags: ['Observação', 'Sentimentos', 'Necessidades', 'Pedidos', 'Diálogo'], icon: 'handshake' },
      { title: 'Retórica e Argumentação', tags: ['Lógica', 'Convencimento', 'Debate', 'Estratégias', 'Falácias'], icon: 'psychology_alt' },
      { title: 'Comunicação Intercultural', tags: ['Globalização', 'Etiqueta', 'Diferenças Culturais', 'Negócios Internacionais', 'Respeito'], icon: 'language' },
      { title: 'Reuniões Eficazes', tags: ['Pauta', 'Moderador', 'Foco', 'Decisão', 'Follow-up'], icon: 'meeting_room' },
      { title: 'Escrita para Web', tags: ['Escaneabilidade', 'SEO Copywriting', 'Títulos', 'Parágrafos Curtos', 'Engajamento'], icon: 'html' }
    ]
  },
  // 10. Design
  {
    title: 'Design', icon: 'design_services', description: 'Crie identidades visuais e interfaces de usuário incríveis.',
    subcategories: [
      { title: 'Design Gráfico (Básico)', tags: ['Photoshop', 'Illustrator', 'Vetores', 'Cores', 'Tipografia'], icon: 'image' },
      { title: 'Branding', tags: ['Identidade Visual', 'Logotipo', 'Propósito de Marca', 'Posicionamento', 'Manual'], icon: 'diamond' },
      { title: 'UX/UI Design', tags: ['Experiência do Usuário', 'Interface', 'Protótipos (Figma)', 'Testes de Usabilidade', 'Wireframe'], icon: 'grid_view' },
      { title: 'Design de Apresentações', tags: ['PowerPoint', 'Keynote', 'Slide Design', 'Storytelling Visual', 'Impacto'], icon: 'slideshow' },
      { title: 'Motion Graphics', tags: ['After Effects', 'Animação', 'Vídeos Curtos', 'Efeitos', 'Transições'], icon: 'motion_photos_on' },
      { title: 'Design Editorial', tags: ['Livros', 'Revistas', 'Diagramação', 'Grid', 'Hierarquia'], icon: 'menu_book' },
      { title: 'Teoria das Cores', tags: ['Psicologia das Cores', 'Harmonia', 'Paletas', 'Significado', 'Contraste'], icon: 'colorize' },
      { title: 'Design para Redes Sociais', tags: ['Templates', 'Proporções', 'Engajamento Visual', 'Stories', 'Carrossel'], icon: 'rss_feed' },
      { title: 'Design de Embalagens', tags: ['Estrutura', 'Materiais', 'Legislação', 'Sustentabilidade', 'Impressão'], icon: 'redeem' },
      { title: 'Design de Ícones', tags: ['Simplicidade', 'Consistência', 'Vetorização', 'Estilos', 'Aplicação'], icon: 'star' }
    ]
  },
  // 11. Idiomas
  {
    title: 'Idiomas', icon: 'translate', description: 'Aprenda novas línguas e se prepare para o mundo.',
    subcategories: [
      { title: 'Inglês para Viagem', tags: ['Frases Essenciais', 'Aeroporto', 'Hotel', 'Restaurante', 'Emergência'], icon: 'luggage' },
      { title: 'Espanhol Básico', tags: ['Vocabulário', 'Gramática (Iniciante)', 'Pronúncia', 'Conversação Simples', 'Cultura'], icon: 'spain' },
      { title: 'Inglês para Negócios', tags: ['E-mails', 'Reuniões', 'Apresentações', 'Termos Técnicos', 'Negociação'], icon: 'attach_money' },
      { title: 'Alemão (A1)', tags: ['Alfabeto', 'Cumprimentos', 'Família', 'Rotina', 'Números'], icon: 'flag' },
      { title: 'Francês (A1)', tags: ['Fonética', 'Vocabulário Básico', 'Cultura', 'Verbos Essenciais', 'Introdução'], icon: 'france' },
      { title: 'Libras (Língua Brasileira de Sinais)', tags: ['Alfabeto Manual', 'Saudações', 'Conversação Básica', 'Cultura Surda', 'Expressão Facial'], icon: 'sign_language' },
      { title: 'Português para Estrangeiros', tags: ['Fonética', 'Gramática Brasileira', 'Gírias', 'Cultura', 'Conversação'], icon: 'book' },
      { title: 'Intercâmbio Cultural', tags: ['Dicas', 'Planejamento', 'Adaptação', 'Documentação', 'Costumes'], icon: 'travel_explore' },
      { title: 'Japonês (Hiragana e Katakana)', tags: ['Escrita Básica', 'Cultura', 'Frases Simples', 'Cumprimentos', 'Vocabulário'], icon: 'japan' },
      { title: 'Aprendizado Acelerado', tags: ['Técnicas de Estudo', 'Imersão', 'Ferramentas', 'Rotina de Estudo', 'Consistência'], icon: 'timer' }
    ]
  },
  // 12. Música
  {
    title: 'Música', icon: 'piano', description: 'Aprenda a tocar instrumentos, teoria e produção musical.',
    subcategories: [
      { title: 'Violão (Iniciante)', tags: ['Acordes Básicos', 'Postura', 'Troca de Acordes', 'Cifras', 'Dedilhado'], icon: 'guitars' },
      { title: 'Canto (Técnicas Vocais)', tags: ['Respiração', 'Aquecimento', 'Projeção', 'Afinação', 'Cuidados com a Voz'], icon: 'mic_external_on' },
      { title: 'Teclado e Piano (Básico)', tags: ['Notação Musical', 'Posição', 'Acordes', 'Escalas', 'Leitura de Partitura'], icon: 'piano' },
      { title: 'Ukulele', tags: ['Acordes', 'Batidas', 'Músicas Simples', 'Trocas', 'Afinação'], icon: 'toy_guitar' },
      { title: 'Produção de Beats', tags: ['Hip-Hop', 'Eletrônica', 'Loop', 'Ritmo', 'Sampler'], icon: 'drums' },
      { title: 'Leitura de Partitura', tags: ['Claves', 'Figuras Rítmicas', 'Alturas', 'Andamento', 'Sinais de Expressão'], icon: 'score' },
      { title: 'Composição de Letras', tags: ['Rimas', 'Métrica', 'Inspiração', 'Estrutura', 'Storytelling'], icon: 'lyrics' },
      { title: 'Gravação Caseira', tags: ['Microfones', 'Interface de Áudio', 'Acústica Simples', 'Softwares Gratuitos', 'Edição'], icon: 'settings_input_composite' },
      { title: 'DJ (Iniciante)', tags: ['Controladora', 'Mixagem', 'Beatmatching', 'Transições', 'Softwares (Rekordbox, Serato)'], icon: 'mixer' },
      { title: 'Gaita (Básica)', tags: ['Posição', 'Notas Simples', 'Ritmo', 'Repertório Fácil', 'Respiração'], icon: 'music_video' }
    ]
  },
  // 13. Saúde e Bem-Estar
  {
    title: 'Saúde e Bem-Estar', icon: 'favorite', description: 'Conhecimento para uma vida mais saudável e equilibrada.',
    subcategories: [
      { title: 'Nutrição (Básica)', tags: ['Alimentação Saudável', 'Macronutrientes', 'Hidratação', 'Leitura de Rótulos', 'Planejamento'], icon: 'nutrition' },
      { title: 'Primeiros Socorros', tags: ['Engasgo', 'Queimaduras', 'Fraturas', 'RCP (somente teoria)', 'Emergências'], icon: 'medical_services' },
      { title: 'Rotinas de Exercícios em Casa', tags: ['Treino com Peso Corporal', 'Alongamento', 'Cardio', 'Postura', 'Segurança'], icon: 'directions_run' },
      { title: 'Massagem (Técnicas Simples)', tags: ['Relaxamento', 'Aromaterapia', 'Pontos de Tensão', 'Auto-Massagem', 'Óleos'], icon: 'back_hand' },
      { title: 'Yoga (Iniciante)', tags: ['Asanas (Poses)', 'Respiração (Pranayama)', 'Meditação', 'Filosofia', 'Alinhamento'], icon: 'self_improvement' },
      { title: 'Qualidade do Sono', tags: ['Higiene do Sono', 'Rotina', 'Ambientes', 'Insônia', 'Melatonina'], icon: 'bedtime' },
      { title: 'Chás e Ervas Medicinais', tags: ['Propriedades', 'Preparo', 'Indicações', 'Contraindicações', 'Armazenamento'], icon: 'local_cafe' },
      { title: 'Gerenciamento de Dor Crônica', tags: ['Postura', 'Exercícios Leves', 'Mindfulness', 'Gatilhos', 'Hábitos'], icon: 'pain' },
      { title: 'Alívio de Estresse', tags: ['Técnicas de Relaxamento', 'Respiração Profunda', 'Hobbies', 'Escalas de Estresse', 'Rotina'], icon: 'spa' },
      { title: 'Postura e Ergonomia', tags: ['Trabalho em Casa (Home Office)', 'Sentar', 'Levantar', 'Computador', 'Prevenção de Dores'], icon: 'chair' }
    ]
  },
  // 14. Escrita e Redação
  {
    title: 'Escrita e Redação', icon: 'edit_square', description: 'Domine a norma culta e técnicas de escrita profissional.',
    subcategories: [
      { title: 'Gramática Normativa', tags: ['Concordância', 'Regência', 'Crase', 'Pontuação', 'Ortografia'], icon: 'spellcheck' },
      { title: 'Técnicas de Pesquisa', tags: ['Fontes Confiáveis', 'Citação (ABNT)', 'Coleta de Dados', 'Organização', 'Análise'], icon: 'search' },
      { title: 'Redação de E-books', tags: ['Estrutura', 'Conteúdo', 'Formatação', 'Capa', 'Publicação'], icon: 'book' },
      { title: 'Revisão de Textos', tags: ['Coerência', 'Coesão', 'Clareza', 'Vícios de Linguagem', 'Estilo'], icon: 'rate_review' },
      { title: 'Ghostwriting', tags: ['Cliente', 'Tom de Voz', 'Prazo', 'Ética', 'Contrato'], icon: 'vpn_key' },
      { title: 'Escrita de Roteiros (Básico)', tags: ['Estrutura', 'Diálogo', 'Formato', 'Personagens', 'Sinopse'], icon: 'theaters' },
      { title: 'Storytelling Empresarial', tags: ['Narrativa', 'Propósito', 'Conexão Emocional', 'Casos de Sucesso', 'Pitch'], icon: 'business' },
      { title: 'Preparação para Concursos (Redação)', tags: ['Dissertação', 'Argumentação', 'Tema', 'Estrutura', 'Nota Máxima'], icon: 'military_tech' },
      { title: 'Produção Acadêmica (TCC, Artigo)', tags: ['Metodologia', 'Revisão Bibliográfica', 'Estrutura', 'Formatação ABNT', 'Escrita Científica'], icon: 'school' },
      { title: 'Jornalismo (Técnicas)', tags: ['Lide', 'Apuração', 'Entrevista', 'Gêneros Jornalísticos', 'Ética'], icon: 'newspaper' }
    ]
  },
  // 15. Habilidades Técnicas
  {
    title: 'Habilidades Técnicas', icon: 'construction', description: 'Aprenda a usar ferramentas e softwares essenciais para o mercado.',
    subcategories: [
      { title: 'Excel (Avançado)', tags: ['Tabela Dinâmica', 'Fórmulas Complexas', 'Macros (VBA)', 'Gráficos', 'Automação'], icon: 'table_chart' },
      { title: 'Ferramentas Google', tags: ['Docs', 'Sheets', 'Apresentações', 'Drive', 'Gmail (Produtividade)'], icon: 'g_mobiledata' },
      { title: 'Criação de Sites (WordPress)', tags: ['Instalação', 'Temas', 'Plugins', 'SEO Básico', 'Manutenção'], icon: 'wordpress' },
      { title: 'AutoCAD (2D)', tags: ['Desenho Técnico', 'Comandos', 'Camadas', 'Plotagem', 'Medidas'], icon: 'architecture' },
      { title: 'Microsoft Word (Profissional)', tags: ['Formatação ABNT', 'Estilos', 'Sumário Automático', 'Mala Direta', 'Revisão'], icon: 'text_fields' },
      { title: 'Gestão de Banco de Dados (SQL)', tags: ['Consultas', 'Criação de Tabelas', 'Índices', 'Joins', 'Fundamentos'], icon: 'database' },
      { title: 'Estatística (Básica)', tags: ['Média', 'Mediana', 'Moda', 'Amostra', 'Gráficos'], icon: 'bar_chart' },
      { title: 'Apresentações Profissionais (Canva)', tags: ['Templates', 'Elementos Visuais', 'Cores', 'Mockups', 'Design Rápido'], icon: 'art_track' },
      { title: 'Gestão de Projetos (Ferramentas)', tags: ['Trello', 'Asana', 'Notion', 'Jira', 'Planejamento'], icon: 'list_alt' },
      { title: 'Edição de PDF', tags: ['Adobe Acrobat', 'Preenchimento', 'Assinatura Digital', 'Conversão', 'Segurança'], icon: 'picture_as_pdf' }
    ]
  },
  // 16. Vídeo
  {
    title: 'Vídeo', icon: 'videocam', description: 'Captação, edição e produção de conteúdo audiovisual.',
    subcategories: [
      { title: 'Edição de Vídeo (Iniciante)', tags: ['Cortes', 'Transições', 'Trilha Sonora', 'Exportação', 'Programas (CapCut, DaVinci)'], icon: 'video_settings' },
      { title: 'Roteiro para Vídeos Curtos', tags: ['TikTok', 'Reels', 'Storytelling', 'Ganchos', 'Retenção'], icon: 'movie_edit' },
      { title: 'Iluminação para Vídeo', tags: ['Três Pontos', 'Softbox', 'Ring Light', 'Luz Natural', 'Sombras'], icon: 'highlight' },
      { title: 'Captação com Celular', tags: ['Estabilização', 'Resolução', 'Áudio', 'Aplicativos', 'Dicas'], icon: 'mobile_friendly' },
      { title: 'Youtuber e Canais', tags: ['Nicho', 'Criação de Conteúdo', 'Monetização', 'Thumbnails', 'SEO para YouTube'], icon: 'play_circle' },
      { title: 'Color Grading', tags: ['Correção de Cor', 'Estilo', 'LUTs', 'Tons de Pele', 'Ajustes Finos'], icon: 'palette' },
      { title: 'Entrevistas em Vídeo', tags: ['Posição da Câmera', 'Áudio', 'Perguntas', 'Ambiente', 'Quebra-gelo'], icon: 'forum' },
      { title: 'Criação de Animação 2D', tags: ['After Effects', 'Personagens', 'Cenários', 'Movimentos', 'Voz Off'], icon: 'animation' },
      { title: 'Voz Off e Narração', tags: ['Dicção', 'Ritmo', 'Equipamento de Áudio', 'Edição', 'Interpretação'], icon: 'mic_none' },
      { title: 'Equipamentos (Básico)', tags: ['Câmeras', 'Lentes', 'Tripé', 'Microfones', 'Custos'], icon: 'camera' }
    ]
  },
  // 17. Moda e Estilo
  {
    title: 'Moda e Estilo', icon: 'checkroom', description: 'Desenvolva sua imagem pessoal e conhecimento em moda.',
    subcategories: [
      { title: 'Consultoria de Imagem (Básico)', tags: ['Cores', 'Tipos de Corpo', 'Estilos Pessoais', 'Guarda-Roupa Inteligente', 'Comunicação Não Verbal'], icon: 'style' },
      { title: 'Maquiagem (Automaquiagem)', tags: ['Preparação de Pele', 'Olhos', 'Contorno', 'Pincéis', 'Tendências'], icon: 'face' },
      { title: 'Cuidado com Cabelos', tags: ['Tipos de Cabelo', 'Cronograma Capilar', 'Produtos', 'Tratamentos', 'Finalização'], icon: 'styler' },
      { title: 'História da Moda', tags: ['Séculos', 'Estilistas', 'Tendências', 'Revoluções', 'Cultura'], icon: 'local_library' },
      { title: 'Montagem de Look', tags: ['Ocasiões', 'Combinações', 'Acessórios', 'Cores', 'Proporções'], icon: 'accessibility' },
      { title: 'Personal Shopping', tags: ['Compras Inteligentes', 'Orçamento', 'Marcas', 'Pesquisa', 'Curadoria'], icon: 'shopping_cart' },
      { title: 'Sustentabilidade na Moda', tags: ['Brechó', 'Upcycling', 'Consumo Consciente', 'Materiais', 'Desperdício'], icon: 'recycling' },
      { title: 'Análise de Cores (Coloração Pessoal)', tags: ['Cartela de Cores', 'Estações', 'Subtom', 'Combinações', 'Maquiagem'], icon: 'colorize' },
      { title: 'Modelagem (Básica)', tags: ['Tirar Medidas', 'Molde', 'Ajustes Simples', 'Tecidos', 'Recorte'], icon: 'square_foot' },
      { title: 'Etiqueta (Social e Profissional)', tags: ['Postura', 'Mesa', 'Eventos', 'Formalidades', 'Apresentação'], icon: 'back_hand' }
    ]
  },
  // 18. Esoterismo e Espiritualidade
  {
    title: 'Esoterismo e Espiritualidade', icon: 'brightness_6', description: 'Caminhos para o autoconhecimento e desenvolvimento espiritual.',
    subcategories: [
      { title: 'Astrologia (Básico)', tags: ['Signos', 'Casas', 'Planetas', 'Mapa Astral', 'Elementos'], icon: 'stars' },
      { title: 'Tarot (Arcanos Maiores)', tags: ['Significado', 'Leitura Intuitiva', 'Simbologia', 'Ética', 'Tipos de Jogo'], icon: 'style' },
      { title: 'Reiki (Nível 1 - Introdução)', tags: ['Energia', 'Símbolos', 'Autoaplicação', 'História', 'Princípios'], icon: 'healing' },
      { title: 'Feng Shui (Básico)', tags: ['Chi', 'Baguá', 'Cinco Elementos', 'Decoração', 'Energia da Casa'], icon: 'home_repair_service' },
      { title: 'Cristais e Pedras', tags: ['Limpeza', 'Energização', 'Propriedades', 'Uso Terapêutico', 'Chakras'], icon: 'diamond' },
      { title: 'Interpretação de Sonhos', tags: ['Símbolos', 'Arquétipos', 'Inconsciente', 'Registro de Sonhos', 'Análise'], icon: 'nightlight' },
      { title: 'Medicina Ayurvédica (Fundamentos)', tags: ['Doshas', 'Rotina Diária', 'Alimentação', 'Desequilíbrio', 'Princípios'], icon: 'spa' },
      { title: 'Leis da Atração', tags: ['Visualização', 'Gratidão', 'Afirmações', 'Crenças Limitantes', 'Energia'], icon: 'wb_incandescent' },
      { title: 'Baralho Cigano (Básico)', tags: ['Cartas', 'Leitura Simples', 'Combinações', 'Mensagens', 'Intuição'], icon: 'tarot' },
      { title: 'Cura Energética (Básico)', tags: ['Aura', 'Chakras', 'Bloqueios', 'Limpeza', 'Proteção'], icon: 'electric_bolt' }
    ]
  },
  // 19. Finanças e Investimentos
  {
    title: 'Finanças e Investimentos', icon: 'monetization_on', description: 'Aprenda a cuidar do seu dinheiro e fazê-lo crescer.',
    subcategories: [
      { title: 'Tesouro Direto e Renda Fixa', tags: ['Títulos Públicos', 'LCI/LCA', 'CDB', 'Selic', 'Segurança'], icon: 'account_balance' },
      { title: 'Ações (Básico)', tags: ['Bolsa de Valores', 'Fundamentos', 'Análise Gráfica (Iniciante)', 'Risco', 'Longo Prazo'], icon: 'trending_up' },
      { title: 'Fundos de Investimento', tags: ['FIIs', 'Multimercado', 'Renda Fixa', 'Gestão', 'Taxas'], icon: 'pie_chart' },
      { title: 'Educação Financeira para Família', tags: ['Orçamento Doméstico', 'Mesada', 'Dívidas', 'Metas', 'Consumo Consciente'], icon: 'family_restroom' },
      { title: 'Contabilidade para Leigos', tags: ['Balanço', 'DRE', 'Ativo', 'Passivo', 'Termos Básicos'], icon: 'calculate' },
      { title: 'Criptomoedas (Básico)', tags: ['Bitcoin', 'Altcoins', 'Wallet', 'Exchange', 'Riscos'], icon: 'currency_bitcoin' },
      { title: 'Imposto de Renda (Declaração Básica)', tags: ['Tipos de Renda', 'Deduções', 'Prazos', 'Software', 'Erros Comuns'], icon: 'receipt' },
      { title: 'Planilha de Gastos', tags: ['Categorização', 'Monitoramento', 'Metodologia', 'Revisão', 'Otimização'], icon: 'list_alt' },
      { title: 'Previdência Privada', tags: ['PGBL', 'VGBL', 'Imposto', 'Tipos de Fundo', 'Aposentadoria'], icon: 'event_repeat' },
      { title: 'Renda Extra Online', tags: ['Freelancer', 'Vendas', 'Afiliados', 'Monetização de Habilidades', 'Plataformas'], icon: 'online_prediction' }
    ]
  },
  // 20. Pet Care e Adestramento
  {
    title: 'Pet Care e Adestramento', icon: 'pets', description: 'Cuidados e técnicas para o bem-estar dos seus animais de estimação.',
    subcategories: [
      { title: 'Adestramento Básico (Cães)', tags: ['Comandos (Senta, Fica)', 'Reforço Positivo', 'Socialização', 'Coleira', 'Rotina'], icon: 'dog' },
      { title: 'Primeiros Socorros para Pets', tags: ['Engasgo', 'Ferimentos', 'Vômito', 'Emergências', 'Prevenção'], icon: 'medical_services' },
      { title: 'Higiene e Estética Animal', tags: ['Banho Seco', 'Escovação de Dentes', 'Corte de Unhas', 'Tosa Higiênica', 'Cuidados Específicos'], icon: 'wash' },
      { title: 'Alimentação Natural para Cães', tags: ['Receitas', 'Nutrientes', 'Restrições', 'Transição', 'Veterinário'], icon: 'restaurant' },
      { title: 'Comportamento Felino', tags: ['Arranhadores', 'Caixas de Areia', 'Enriquecimento Ambiental', 'Brincadeiras', 'Linguagem Corporal'], icon: 'cat' },
      { title: 'Cuidados com Roedores', tags: ['Gaiola', 'Alimentação', 'Higiene', 'Espécies', 'Manuseio'], icon: 'mouse' },
      { title: 'Comportamento Destrutivo', tags: ['Ansiedade de Separação', 'Latidos Excessivos', 'Roer Móveis', 'Soluções', 'Treinamento'], icon: 'delete_sweep' },
      { title: 'Viagem com Animais', tags: ['Documentação', 'Transporte Aéreo/Terrestre', 'Segurança', 'Adaptação', 'Checklist'], icon: 'flight' },
      { title: 'Saúde Preventiva', tags: ['Vacinas', 'Vermífugos', 'Pulgas e Carrapatos', 'Check-ups', 'Sintomas de Alerta'], icon: 'health_and_safety' },
      { title: 'Adestramento de Gatos', tags: ['Caixa de Transporte', 'Arranhadores', 'Comandos', 'Reforço Positivo', 'Clicker Training'], icon: 'pets' }
    ]
  }
];

// Função auxiliar para gerar slugs limpos
const generateSlug = (text) => slugify(text, { lower: true, strict: true, locale: 'pt' });


async function seed() {
  try {
    console.log('═'.repeat(50));
    console.log('🚀 INICIANDO O POVOAMENTO (SEEDING) DO SANITY');

    // 1. Importa o client do Sanity
    const clientModule = await import('../src/config/sanityClient.js');
    const client = clientModule.default;

    // 2. Cria o objeto de transação para as operações
    let transaction = client.transaction();
    const references = { categories: {}, subcategories: {} };
    let documentsCreated = 0;

    // --- FASE 1: CATEGORIAS ---
    console.log('\n🌟 Criando CATEGORIAS...');
    SEED_DATA.forEach(cat => {
      const categoryId = `category-${generateSlug(cat.title)}`;
      const categoryDoc = {
        _id: categoryId,
        _type: 'category',
        title: cat.title,
        slug: { current: generateSlug(cat.title) },
        description: cat.description,
        icon: cat.icon || 'star'
      };
      transaction.createOrReplace(categoryDoc);
      references.categories[cat.title] = categoryId;
      documentsCreated++;
    });
    console.log(`✅ ${SEED_DATA.length} categorias adicionadas à transação.`);
    
    // Executa a transação de categorias para obter os IDs
    await transaction.commit();
    transaction = client.transaction(); // Inicia uma nova transação

    // --- FASE 2: SUBCATEGORIAS ---
    console.log('\n✨ Criando SUBCATEGORIAS...');
    SEED_DATA.forEach(cat => {
      const categoryId = references.categories[cat.title];
      if (!categoryId) return;

      cat.subcategories.forEach(sub => {
        const subcategoryId = `subcategory-${generateSlug(sub.title)}`;
        const subcategoryDoc = {
          _id: subcategoryId,
          _type: 'subcategory',
          title: sub.title,
          slug: { current: generateSlug(sub.title) },
          description: `Subcategoria de ${cat.title} focada em ${sub.title}.`,
          icon: sub.icon || 'folder',
          category: {
            _type: 'reference',
            _ref: categoryId
          }
        };
        transaction.createOrReplace(subcategoryDoc);
        references.subcategories[sub.title] = subcategoryId;
        documentsCreated++;
      });
    });
    console.log(`✅ ${documentsCreated - SEED_DATA.length} subcategorias adicionadas à transação.`);
    
    // Executa a transação de subcategorias
    await transaction.commit();
    transaction = client.transaction(); // Inicia uma nova transação

    // --- FASE 3: TAGS ---
    console.log('\n🏷️ Criando TAGS...');
    let tagsCreated = 0;
    SEED_DATA.forEach(cat => {
      cat.subcategories.forEach(sub => {
        const subcategoryId = references.subcategories[sub.title];
        if (!subcategoryId) return;

        sub.tags.forEach(tagName => {
          const tagId = `tag-${generateSlug(tagName)}`;
          const tagDoc = {
            _id: tagId,
            _type: 'tag',
            title: tagName,
            slug: { current: generateSlug(tagName) },
            subcategory: {
              _type: 'reference',
              _ref: subcategoryId
            }
          };
          transaction.createOrReplace(tagDoc);
          tagsCreated++;
          documentsCreated++;
        });
      });
    });
    console.log(`✅ ${tagsCreated} tags adicionadas à transação.`);

    // Executa a transação de tags e finaliza
    await transaction.commit();

    // --- RELATÓRIO FINAL ---
    console.log('\n🎉 POVOAMENTO CONCLUÍDO!');
    console.log('═'.repeat(50));
    console.log(`✅ Total de documentos criados/atualizados: ${documentsCreated}`);
    console.log('💾 Seu Sanity CMS está pronto com a estrutura de categorias!');

  } catch (error) {
    console.error('💥 ERRO NO PROCESSO DE SEEDING:', error.message);
    console.error('Stack:', error.stack);
  }
}

seed().catch(console.error);