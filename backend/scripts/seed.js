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
  {
    "title": "Arte e Cultura", 
    "icon": "palette", 
    "description": "Aprenda técnicas de expressão visual e história da arte.",
    "subcategories": [
      { 
        "title": "Arte Digital", 
        "tags": ["Concept Art", "Ilustração", "Photoshop", "Procreate", "Tablet Gráfico"], 
        "icon": "camera_roll" 
      },
      { 
        "title": "Caligrafia", 
        "tags": ["Escrita Decorativa", "Fontes", "Lettering", "Tinta", "Tipografia"], 
        "icon": "edit" 
      },
      { 
        "title": "Criação de Personagens", 
        "tags": ["Conceito", "Design de Personagem", "Expressões", "Narrativa Visual", "Roteiro"], 
        "icon": "person_add" 
      },
      { 
        "title": "Curadoria", 
        "tags": ["Acervo", "Coleção", "Conceito", "Exposição", "Montagem"], 
        "icon": "view_list" 
      },
      { 
        "title": "Desenho", 
        "tags": ["Anatomia", "Mangá", "Perspectiva", "Retrato", "Sketch"], 
        "icon": "brush" 
      },
      { 
        "title": "Desenho Arquitetônico", 
        "tags": ["Croqui", "Escala", "Perspectiva", "Plantas", "SketchUp"], 
        "icon": "apartment" 
      },
      { 
        "title": "Escultura", 
        "tags": ["Argila", "Cerâmica", "História da Arte", "Materiais", "Modelagem 3D"], 
        "icon": "museum" 
      },
      { 
        "title": "História da Arte", 
        "tags": ["Apreciação", "Artistas", "Crítica", "Movimentos", "Períodos"], 
        "icon": "article" 
      },
      { 
        "title": "Pintura", 
        "tags": ["Acrílico", "Aquarela", "Óleo", "Tela", "Teoria das Cores"], 
        "icon": "format_paint" 
      },
      { 
        "title": "Restauro", 
        "tags": ["Conservação", "Documentação", "Limpeza", "Materiais", "Técnicas Antigas"], 
        "icon": "build" 
      }
    ]
  },
  {
    "title": "Áudio", 
    "icon": "headphones", 
    "description": "Técnicas de gravação, produção e edição sonora.",
    "subcategories": [
      { 
        "title": "Criação de Podcast", 
        "tags": ["Edição", "Equipamento", "Entrevista", "Publicação", "Roteiro"], 
        "icon": "mic" 
      },
      { 
        "title": "Design de Som", 
        "tags": ["Ambientes", "Efeitos", "Foley", "Manipulação", "Soundscape"], 
        "icon": "hearing" 
      },
      { 
        "title": "Edição de Áudio", 
        "tags": ["Cortes", "Limpeza", "Normalização", "Podcasts", "Softwares (Audacity)"], 
        "icon": "content_cut" 
      },
      { 
        "title": "Locução e Dublagem", 
        "tags": ["Dicção", "Equipamento", "Estúdio", "Interpretação", "Vórtice"], 
        "icon": "voice_over_off" 
      },
      { 
        "title": "Masterização", 
        "tags": ["Distribuição", "Finalização", "Limiter", "Padrões", "Volume"], 
        "icon": "compress" 
      },
      { 
        "title": "Mixagem", 
        "tags": ["Balanceamento", "Compressão", "Efeitos", "Equalização", "Referência"], 
        "icon": "settings_mixer" 
      },
      { 
        "title": "Produção Musical (Iniciante)", 
        "tags": ["DAW (Ableton, Logic)", "Gravação", "Harmonia", "Instrumentos Virtuais", "MIDI"], 
        "icon": "tune" 
      },
      { 
        "title": "Sonorização (Ao Vivo)", 
        "tags": ["Acústica", "Cabos", "Mesa de Som", "Microfones", "Monitoração"], 
        "icon": "volume_up" 
      },
      { 
        "title": "Teoria Musical", 
        "tags": ["Acordes", "Escalas", "Leitura de Partitura", "Notas", "Ritmo"], 
        "icon": "music_note" 
      },
      { 
        "title": "Trilha Sonora", 
        "tags": ["Cinema", "Composição", "Efeitos Sonoros", "Games", "Licenças"], 
        "icon": "movie" 
      }
    ]
  },
  {
    "title": "Casa e Jardim", 
    "icon": "home", 
    "description": "Habilidades para o lar, culinária e pequenos reparos.",
    "subcategories": [
      { 
        "title": "Costura (Iniciante)", 
        "tags": ["Consertos", "Máquina de Costura", "Modelagem Simples", "Tecidos", "Tipos de Ponto"], 
        "icon": "content_cut" 
      },
      { 
        "title": "Cozinha (Básica)", 
        "tags": ["Cortes", "Higiene", "Receitas Fáceis", "Temperos", "Utensílios"], 
        "icon": "restaurant" 
      },
      { 
        "title": "Culinária Vegana", 
        "tags": ["Ingredientes", "Nutrição Vegetal", "Pratos Principais", "Receitas Sem Carne", "Substituições"], 
        "icon": "spa" 
      },
      { 
        "title": "Decoração (DIY)", 
        "tags": ["Artesanato", "Estilos", "Faça Você Mesmo", "Materiais Reciclados", "Moodboard"], 
        "icon": "auto_fix_normal" 
      },
      { 
        "title": "Hortas Urbanas", 
        "tags": ["Compostagem", "Plantas Comestíveis", "Pragas", "Sustentabilidade", "Vasos"], 
        "icon": "eco" 
      },
      { 
        "title": "Jardinagem (Iniciante)", 
        "tags": ["Cultivo", "Ferramentas", "Irrigação", "Plantio", "Solo"], 
        "icon": "local_florist" 
      },
      { 
        "title": "Maridagem (Manutenção Geral)", 
        "tags": ["Conserto de Eletrodomésticos", "Dicas", "Ferramentas Elétricas", "Montagem de Móveis", "Segurança"], 
        "icon": "construction" 
      },
      { 
        "title": "Organização Doméstica", 
        "tags": ["Desapego (Marie Kondo)", "Limpeza", "Otimização de Espaço", "Produtividade", "Rotina"], 
        "icon": "format_list_bulleted" 
      },
      { 
        "title": "Pequenos Reparos Domésticos", 
        "tags": ["Elétrica (Tomadas)", "Ferramentas", "Hidráulica (Vazamentos)", "Pintura", "Segurança"], 
        "icon": "handyman" 
      },
      { 
        "title": "Plantas de Interior", 
        "tags": ["Cuidados", "Decoração", "Iluminação", "Tipos de Plantas", "Umidade"], 
        "icon": "grass" 
      }
    ]
  },
  {
    "title": "Comunicação", 
    "icon": "forum", 
    "description": "Melhore sua escrita e a forma como interage com o mundo.",
    "subcategories": [
      { 
        "title": "Comunicação Intercultural", 
        "tags": ["Diferenças Culturais", "Etiqueta", "Globalização", "Negócios Internacionais", "Respeito"], 
        "icon": "language" 
      },
      { 
        "title": "Comunicação Não-Violenta (CNV)", 
        "tags": ["Diálogo", "Necessidades", "Observação", "Pedidos", "Sentimentos"], 
        "icon": "handshake" 
      },
      { 
        "title": "Copywriting (Conteúdo)", 
        "tags": ["Call to Action (CTA)", "Estrutura", "Headlines", "Persuasão", "Vendas"], 
        "icon": "gavel" 
      },
      { 
        "title": "Escrita Criativa", 
        "tags": ["Bloqueio Criativo", "Diálogo", "Gêneros Literários", "Personagens", "Storytelling"], 
        "icon": "border_color" 
      },
      { 
        "title": "Escrita para Web", 
        "tags": ["Engajamento", "Escaneabilidade", "Parágrafos Curtos", "SEO Copywriting", "Títulos"], 
        "icon": "html" 
      },
      { 
        "title": "Media Training", 
        "tags": ["Crises", "Entrevistas", "Imagem Pública", "Mensagens-chave", "Postura"], 
        "icon": "tv" 
      },
      { 
        "title": "Oratória (Avançada)", 
        "tags": ["Conexão com Público", "Gestão do Medo", "Improviso", "Linguagem Corporal", "Voz"], 
        "icon": "campaign" 
      },
      { 
        "title": "Redação Profissional", 
        "tags": ["Clareza", "Documentos", "E-mails", "Gramática", "Relatórios"], 
        "icon": "description" 
      },
      { 
        "title": "Reuniões Eficazes", 
        "tags": ["Decisão", "Follow-up", "Foco", "Moderador", "Pauta"], 
        "icon": "meeting_room" 
      },
      { 
        "title": "Retórica e Argumentação", 
        "tags": ["Convencimento", "Debate", "Estratégias", "Falácias", "Lógica"], 
        "icon": "psychology_alt" 
      }
    ]
  },
  {
    "title": "Culinária", 
    "icon": "chef_hat", 
    "description": "Técnicas culinárias, panificação, confeitaria e gastronomia.",
    "subcategories": [
      { 
        "title": "Chef em Casa (Organização)", 
        "tags": ["Cozinhar em Lote", "Desperdício Zero", "Mise en Place", "Planejamento de Cardápio", "Rapidez"], 
        "icon": "list_alt" 
      },
      { 
        "title": "Confeitaria Clássica", 
        "tags": ["Bolos", "Chocolates", "Cremes", "Decoração", "Técnicas"], 
        "icon": "cake" 
      },
      { 
        "title": "Corte de Carnes", 
        "tags": ["Açougue", "Churrasco", "Ponto da Carne", "Preparação", "Temperos"], 
        "icon": "outdoor_grill" 
      },
      { 
        "title": "Cozinha Brasileira Regional", 
        "tags": ["Amazônica", "História", "Ingredientes Típicos", "Mineira", "Nordeste"], 
        "icon": "flag" 
      },
      { 
        "title": "Cozinha Internacional (Japonesa)", 
        "tags": ["Arroz", "Etiqueta", "Molhos", "Sashimi", "Sushi"], 
        "icon": "japan" 
      },
      { 
        "title": "Doces e Sobremesas Saudáveis", 
        "tags": ["Equilíbrio", "Ingredientes Naturais", "Low Carb", "Receitas", "Sem Açúcar"], 
        "icon": "icecream" 
      },
      { 
        "title": "Gastronomia Vegana (Avançada)", 
        "tags": ["Empratamento", "Pratos Elaborados", "Queijos Vegetais", "Substitutos", "Texturas"], 
        "icon": "restaurant" 
      },
      { 
        "title": "Harmonização (Vinhos)", 
        "tags": ["Queijos", "Serviço", "Técnicas de Degustação", "Tipos de Vinho", "Uvas"], 
        "icon": "wine_bar" 
      },
      { 
        "title": "Higiene e Segurança Alimentar", 
        "tags": ["Boas Práticas", "Armazenamento", "Prevenção de Contaminação", "Temperaturas", "Vigilância Sanitária"], 
        "icon": "health_and_safety" 
      },
      { 
        "title": "Panificação Artesanal", 
        "tags": ["Farinhas", "Fermentação Natural", "Fornos", "Massa Básica", "Sourdough"], 
        "icon": "bakery_dining" 
      }
    ]
  },
  {
    "title": "Design", 
    "icon": "design_services", 
    "description": "Crie identidades visuais e interfaces de usuário incríveis.",
    "subcategories": [
      { 
        "title": "Branding", 
        "tags": ["Identidade Visual", "Logotipo", "Manual", "Posicionamento", "Propósito de Marca"], 
        "icon": "diamond" 
      },
      { 
        "title": "Design de Apresentações", 
        "tags": ["Impacto", "Keynote", "PowerPoint", "Slide Design", "Storytelling Visual"], 
        "icon": "slideshow" 
      },
      { 
        "title": "Design de Embalagens", 
        "tags": ["Estrutura", "Impressão", "Legislação", "Materiais", "Sustentabilidade"], 
        "icon": "redeem" 
      },
      { 
        "title": "Design de Ícones", 
        "tags": ["Aplicação", "Consistência", "Simplicidade", "Estilos", "Vetorização"], 
        "icon": "star" 
      },
      { 
        "title": "Design Editorial", 
        "tags": ["Diagramação", "Grid", "Hierarquia", "Livros", "Revistas"], 
        "icon": "menu_book" 
      },
      { 
        "title": "Design Gráfico (Básico)", 
        "tags": ["Cores", "Photoshop", "Illustrator", "Tipografia", "Vetores"], 
        "icon": "image" 
      },
      { 
        "title": "Design para Redes Sociais", 
        "tags": ["Carrossel", "Engajamento Visual", "Proporções", "Stories", "Templates"], 
        "icon": "rss_feed" 
      },
      { 
        "title": "Motion Graphics", 
        "tags": ["After Effects", "Animação", "Efeitos", "Transições", "Vídeos Curtos"], 
        "icon": "motion_photos_on" 
      },
      { 
        "title": "Teoria das Cores", 
        "tags": ["Contraste", "Harmonia", "Paletas", "Psicologia das Cores", "Significado"], 
        "icon": "colorize" 
      },
      { 
        "title": "UX/UI Design", 
        "tags": ["Experiência do Usuário", "Interface", "Protótipos (Figma)", "Testes de Usabilidade", "Wireframe"], 
        "icon": "grid_view" 
      }
    ]
  },
  {
    "title": "Desenvolvimento Pessoal", 
    "icon": "self_improvement", 
    "description": "Cursos para aprimoramento de habilidades soft skills e bem-estar.",
    "subcategories": [
      { 
        "title": "Comunicação e Oratória", 
        "tags": ["Apresentação", "Argumentação", "Clareza", "Falar em Público", "Linguagem Corporal"], 
        "icon": "record_voice_over" 
      },
      { 
        "title": "Criação de Hábitos", 
        "tags": ["Autossabotagem", "Consistência", "Disciplina", "Motivação", "Rotina Matinal"], 
        "icon": "fitness_center" 
      },
      { 
        "title": "Desenvolvimento de Carreira", 
        "tags": ["Currículo", "Entrevista", "Networking", "Propósito", "Transição de Carreira"], 
        "icon": "work" 
      },
      { 
        "title": "Finanças Pessoais", 
        "tags": ["Dívidas", "Educação Financeira", "Investimentos (Iniciante)", "Planejamento", "Renda Extra"], 
        "icon": "savings" 
      },
      { 
        "title": "Gestão do Estresse", 
        "tags": ["Burnout", "Equilíbrio", "Limites", "Rotina", "Saúde Mental"], 
        "icon": "sick" 
      },
      { 
        "title": "Habilidades de Estudo", 
        "tags": ["Aprendizado Acelerado", "Leitura Dinâmica", "Mapas Mentais", "Memorização", "Organização"], 
        "icon": "school" 
      },
      { 
        "title": "Inteligência Emocional", 
        "tags": ["Autocontrole", "Autoconhecimento", "Emoções", "Empatia", "Resiliência"], 
        "icon": "sentiment_satisfied" 
      },
      { 
        "title": "Mindfulness e Meditação", 
        "tags": ["Atenção Plena", "Bem-estar", "Concentração", "Redução de Estresse", "Relaxamento"], 
        "icon": "psychology" 
      },
      { 
        "title": "Produtividade", 
        "tags": ["Foco", "Gestão do Tempo", "Hábitos", "Metas", "Priorização"], 
        "icon": "schedule" 
      },
      { 
        "title": "Relacionamentos Interpessoais", 
        "tags": ["Amizade", "Comunicação Não-Violenta (CNV)", "Conflitos", "Família", "Socialização"], 
        "icon": "people_alt" 
      }
    ]
  },
  {
    "title": "Empreendedorismo", 
    "icon": "business_center", 
    "description": "Cursos para abrir e gerir seu próprio negócio.",
    "subcategories": [
      { 
        "title": "Abertura de Empresa (MEI)", 
        "tags": ["Alvará", "Formalização", "Impostos", "Nota Fiscal", "Obrigações"], 
        "icon": "badge" 
      },
      { 
        "title": "Atendimento ao Cliente", 
        "tags": ["CRM", "Pós-venda", "Relacionamento", "Retenção", "Sucesso do Cliente (CS)"], 
        "icon": "support_agent" 
      },
      { 
        "title": "Captação de Recursos", 
        "tags": ["Apresentação", "Crowdfunding", "Financiamento", "Investimento Anjo", "Pitch"], 
        "icon": "trending_up" 
      },
      { 
        "title": "E-commerce", 
        "tags": ["Gestão de Estoque", "Logística", "Marketplace", "Meios de Pagamento", "Plataformas"], 
        "icon": "storefront" 
      },
      { 
        "title": "Gestão de Projetos", 
        "tags": ["Cronograma", "Escopo", "Metodologias Ágeis", "Riscos", "Scrum"], 
        "icon": "date_range" 
      },
      { 
        "title": "Gestão Financeira", 
        "tags": ["Custos", "Fluxo de Caixa", "Orçamento", "Precificação", "Saúde Financeira"], 
        "icon": "account_balance_wallet" 
      },
      { 
        "title": "Inovação e Criatividade", 
        "tags": ["Brainstorming", "Design Thinking", "Geração de Ideias", "Solução de Problemas", "Tendências"], 
        "icon": "lightbulb" 
      },
      { 
        "title": "Liderança e Equipes", 
        "tags": ["Cultura Organizacional", "Delegação", "Feedback", "Gestão de Conflitos", "Motivação"], 
        "icon": "diversity_3" 
      },
      { 
        "title": "Plano de Negócios", 
        "tags": ["Análise SWOT", "Canvas", "Modelo de Negócios", "MVP", "Viabilidade"], 
        "icon": "assignment" 
      },
      { 
        "title": "Vendas e Negociação", 
        "tags": ["Fechamento", "Objeções", "Prospecção", "SDR", "Técnicas de Venda"], 
        "icon": "handshake" 
      }
    ]
  },
  {
    "title": "Escrita e Redação", 
    "icon": "edit_square", 
    "description": "Domine a norma culta e técnicas de escrita profissional.",
    "subcategories": [
      { 
        "title": "Escrita de Roteiros (Básico)", 
        "tags": ["Diálogo", "Estrutura", "Formato", "Personagens", "Sinopse"], 
        "icon": "theaters" 
      },
      { 
        "title": "Ghostwriting", 
        "tags": ["Cliente", "Contrato", "Ética", "Prazo", "Tom de Voz"], 
        "icon": "vpn_key" 
      },
      { 
        "title": "Gramática Normativa", 
        "tags": ["Concordância", "Crase", "Ortografia", "Pontuação", "Regência"], 
        "icon": "spellcheck" 
      },
      { 
        "title": "Jornalismo (Técnicas)", 
        "tags": ["Apuração", "Entrevista", "Ética", "Gêneros Jornalísticos", "Lide"], 
        "icon": "newspaper" 
      },
      { 
        "title": "Preparação para Concursos (Redação)", 
        "tags": ["Argumentação", "Dissertação", "Estrutura", "Nota Máxima", "Tema"], 
        "icon": "military_tech" 
      },
      { 
        "title": "Produção Acadêmica (TCC, Artigo)", 
        "tags": ["Escrita Científica", "Formatação ABNT", "Estrutura", "Metodologia", "Revisão Bibliográfica"], 
        "icon": "school" 
      },
      { 
        "title": "Redação de E-books", 
        "tags": ["Capa", "Conteúdo", "Estrutura", "Formatação", "Publicação"], 
        "icon": "book" 
      },
      { 
        "title": "Revisão de Textos", 
        "tags": ["Clareza", "Coerência", "Coesão", "Estilo", "Vícios de Linguagem"], 
        "icon": "rate_review" 
      },
      { 
        "title": "Storytelling Empresarial", 
        "tags": ["Casos de Sucesso", "Conexão Emocional", "Narrativa", "Pitch", "Propósito"], 
        "icon": "business" 
      },
      { 
        "title": "Técnicas de Pesquisa", 
        "tags": ["Análise", "Citação (ABNT)", "Coleta de Dados", "Fontes Confiáveis", "Organização"], 
        "icon": "search" 
      }
    ]
  },
  {
    "title": "Esoterismo e Espiritualidade", 
    "icon": "brightness_6", 
    "description": "Caminhos para o autoconhecimento e desenvolvimento espiritual.",
    "subcategories": [
      { 
        "title": "Astrologia (Básico)", 
        "tags": ["Casas", "Elementos", "Mapa Astral", "Planetas", "Signos"], 
        "icon": "stars" 
      },
      { 
        "title": "Baralho Cigano (Básico)", 
        "tags": ["Cartas", "Combinações", "Intuição", "Leitura Simples", "Mensagens"], 
        "icon": "tarot" 
      },
      { 
        "title": "Cristais e Pedras", 
        "tags": ["Chakras", "Energização", "Limpeza", "Propriedades", "Uso Terapêutico"], 
        "icon": "diamond" 
      },
      { 
        "title": "Cura Energética (Básico)", 
        "tags": ["Aura", "Bloqueios", "Chakras", "Limpeza", "Proteção"], 
        "icon": "electric_bolt" 
      },
      { 
        "title": "Feng Shui (Básico)", 
        "tags": ["Baguá", "Chi", "Cinco Elementos", "Decoração", "Energia da Casa"], 
        "icon": "home_repair_service" 
      },
      { 
        "title": "Interpretação de Sonhos", 
        "tags": ["Análise", "Arquétipos", "Inconsciente", "Registro de Sonhos", "Símbolos"], 
        "icon": "nightlight" 
      },
      { 
        "title": "Leis da Atração", 
        "tags": ["Afirmações", "Crenças Limitantes", "Energia", "Gratidão", "Visualização"], 
        "icon": "wb_incandescent" 
      },
      { 
        "title": "Medicina Ayurvédica (Fundamentos)", 
        "tags": ["Alimentação", "Desequilíbrio", "Doshas", "Princípios", "Rotina Diária"], 
        "icon": "spa" 
      },
      { 
        "title": "Reiki (Nível 1 - Introdução)", 
        "tags": ["Autoaplicação", "Energia", "História", "Princípios", "Símbolos"], 
        "icon": "healing" 
      },
      { 
        "title": "Tarot (Arcanos Maiores)", 
        "tags": ["Ética", "Leitura Intuitiva", "Significado", "Simbologia", "Tipos de Jogo"], 
        "icon": "style" 
      }
    ]
  },
  {
    "title": "Finanças e Investimentos", 
    "icon": "monetization_on", 
    "description": "Aprenda a cuidar do seu dinheiro e fazê-lo crescer.",
    "subcategories": [
      { 
        "title": "Ações (Básico)", 
        "tags": ["Análise Gráfica (Iniciante)", "Bolsa de Valores", "Fundamentos", "Longo Prazo", "Risco"], 
        "icon": "trending_up" 
      },
      { 
        "title": "Contabilidade para Leigos", 
        "tags": ["Ativo", "Balanço", "DRE", "Passivo", "Termos Básicos"], 
        "icon": "calculate" 
      },
      { 
        "title": "Criptomoedas (Básico)", 
        "tags": ["Altcoins", "Bitcoin", "Exchange", "Riscos", "Wallet"], 
        "icon": "currency_bitcoin" 
      },
      { 
        "title": "Educação Financeira para Família", 
        "tags": ["Consumo Consciente", "Dívidas", "Mesada", "Metas", "Orçamento Doméstico"], 
        "icon": "family_restroom" 
      },
      { 
        "title": "Fundos de Investimento", 
        "tags": ["FIIs", "Gestão", "Multimercado", "Renda Fixa", "Taxas"], 
        "icon": "pie_chart" 
      },
      { 
        "title": "Imposto de Renda (Declaração Básica)", 
        "tags": ["Deduções", "Erros Comuns", "Prazos", "Software", "Tipos de Renda"], 
        "icon": "receipt" 
      },
      { 
        "title": "Planilha de Gastos", 
        "tags": ["Categorização", "Metodologia", "Monitoramento", "Otimização", "Revisão"], 
        "icon": "list_alt" 
      },
      { 
        "title": "Previdência Privada", 
        "tags": ["Aposentadoria", "Imposto", "PGBL", "Tipos de Fundo", "VGBL"], 
        "icon": "event_repeat" 
      },
      { 
        "title": "Renda Extra Online", 
        "tags": ["Afiliados", "Freelancer", "Monetização de Habilidades", "Plataformas", "Vendas"], 
        "icon": "online_prediction" 
      },
      { 
        "title": "Tesouro Direto e Renda Fixa", 
        "tags": ["CDB", "LCI/LCA", "Segurança", "Selic", "Títulos Públicos"], 
        "icon": "account_balance" 
      }
    ]
  },
  {
    "title": "Fotografia", 
    "icon": "photo_camera", 
    "description": "Dominando a arte de capturar imagens e a edição.",
    "subcategories": [
      { 
        "title": "Composição Visual", 
        "tags": ["Enquadramento", "Linhas", "Padrões", "Regra dos Terços", "Simetria"], 
        "icon": "grid_on" 
      },
      { 
        "title": "Edição (Lightroom)", 
        "tags": ["Contraste", "Cor", "Organização de Arquivos", "Presets", "Recorte"], 
        "icon": "photo_filter" 
      },
      { 
        "title": "Edição (Photoshop)", 
        "tags": ["Camadas", "Manipulação", "Máscaras", "Retoque Avançado", "Seleção"], 
        "icon": "layers" 
      },
      { 
        "title": "Estúdio e Flash", 
        "tags": ["Flash Speedlight", "Luz Contínua", "Snoot", "Softbox", "Strobist"], 
        "icon": "flash_on" 
      },
      { 
        "title": "Fotografia de Produtos", 
        "tags": ["Detalhes", "E-commerce", "Flat Lay", "Fundo Infinito", "Iluminação"], 
        "icon": "shopping_bag" 
      },
      { 
        "title": "Fotografia Mobile", 
        "tags": ["Aplicativos", "Câmera do Celular", "Composição", "Dicas", "Luz Natural"], 
        "icon": "camera_alt" 
      },
      { 
        "title": "Fotojornalismo", 
        "tags": ["Cobertura", "Documentação", "Ética", "Momentos", "Narrativa"], 
        "icon": "public" 
      },
      { 
        "title": "Fundamentos", 
        "tags": ["Abertura", "Exposição", "ISO", "Triângulo de Exposição", "Velocidade"], 
        "icon": "exposure" 
      },
      { 
        "title": "Paisagem", 
        "tags": ["Composição", "Filtros", "Horário Dourado", "Longa Exposição", "Natureza"], 
        "icon": "landscape" 
      },
      { 
        "title": "Retrato", 
        "tags": ["Ambiente", "Edição de Pele", "Expressão", "Iluminação", "Poses"], 
        "icon": "portrait" 
      }
    ]
  },
  {
    "title": "Habilidades Técnicas", 
    "icon": "construction", 
    "description": "Aprenda a usar ferramentas e softwares essenciais para o mercado.",
    "subcategories": [
      { 
        "title": "Apresentações Profissionais (Canva)", 
        "tags": ["Cores", "Design Rápido", "Elementos Visuais", "Mockups", "Templates"], 
        "icon": "art_track" 
      },
      { 
        "title": "AutoCAD (2D)", 
        "tags": ["Camadas", "Comandos", "Desenho Técnico", "Medidas", "Plotagem"], 
        "icon": "architecture" 
      },
      { 
        "title": "Criação de Sites (WordPress)", 
        "tags": ["Instalação", "Manutenção", "Plugins", "SEO Básico", "Temas"], 
        "icon": "wordpress" 
      },
      { 
        "title": "Edição de PDF", 
        "tags": ["Adobe Acrobat", "Assinatura Digital", "Conversão", "Preenchimento", "Segurança"], 
        "icon": "picture_as_pdf" 
      },
      { 
        "title": "Estatística (Básica)", 
        "tags": ["Amostra", "Gráficos", "Média", "Mediana", "Moda"], 
        "icon": "bar_chart" 
      },
      { 
        "title": "Excel (Avançado)", 
        "tags": ["Automação", "Fórmulas Complexas", "Gráficos", "Macros (VBA)", "Tabela Dinâmica"], 
        "icon": "table_chart" 
      },
      { 
        "title": "Ferramentas Google", 
        "tags": ["Apresentações", "Docs", "Drive", "Gmail (Produtividade)", "Sheets"], 
        "icon": "g_mobiledata" 
      },
      { 
        "title": "Gestão de Banco de Dados (SQL)", 
        "tags": ["Consultas", "Criação de Tabelas", "Fundamentos", "Índices", "Joins"], 
        "icon": "database" 
      },
      { 
        "title": "Gestão de Projetos (Ferramentas)", 
        "tags": ["Asana", "Jira", "List_alt", "Notion", "Trello"], 
        "icon": "list_alt" 
      },
      { 
        "title": "Microsoft Word (Profissional)", 
        "tags": ["Estilos", "Formatação ABNT", "Mala Direta", "Revisão", "Sumário Automático"], 
        "icon": "text_fields" 
      }
    ]
  },
  {
    "title": "Idiomas", 
    "icon": "translate", 
    "description": "Aprenda novas línguas e se prepare para o mundo.",
    "subcategories": [
      { 
        "title": "Alemão (A1)", 
        "tags": ["Alfabeto", "Cumprimentos", "Família", "Números", "Rotina"], 
        "icon": "flag" 
      },
      { 
        "title": "Aprendizado Acelerado", 
        "tags": ["Consistência", "Ferramentas", "Imersão", "Rotina de Estudo", "Técnicas de Estudo"], 
        "icon": "timer" 
      },
      { 
        "title": "Espanhol Básico", 
        "tags": ["Conversação Simples", "Cultura", "Gramática (Iniciante)", "Pronúncia", "Vocabulário"], 
        "icon": "spain" 
      },
      { 
        "title": "Francês (A1)", 
        "tags": ["Cultura", "Fonética", "Introdução", "Verbos Essenciais", "Vocabulário Básico"], 
        "icon": "france" 
      },
      { 
        "title": "Inglês para Negócios", 
        "tags": ["Apresentações", "E-mails", "Negociação", "Reuniões", "Termos Técnicos"], 
        "icon": "attach_money" 
      },
      { 
        "title": "Inglês para Viagem", 
        "tags": ["Aeroporto", "Emergência", "Frases Essenciais", "Hotel", "Restaurante"], 
        "icon": "luggage" 
      },
      { 
        "title": "Intercâmbio Cultural", 
        "tags": ["Adaptação", "Costumes", "Dicas", "Documentação", "Planejamento"], 
        "icon": "travel_explore" 
      },
      { 
        "title": "Japonês (Hiragana e Katakana)", 
        "tags": ["Cultura", "Cumprimentos", "Escrita Básica", "Frases Simples", "Vocabulário"], 
        "icon": "japan" 
      },
      { 
        "title": "Libras (Língua Brasileira de Sinais)", 
        "tags": ["Alfabeto Manual", "Conversação Básica", "Cultura Surda", "Expressão Facial", "Saudações"], 
        "icon": "sign_language" 
      },
      { 
        "title": "Português para Estrangeiros", 
        "tags": ["Conversação", "Cultura", "Fonética", "Gírias", "Gramática Brasileira"], 
        "icon": "book" 
      }
    ]
  },
  {
    "title": "Manutenção", 
    "icon": "handyman", 
    "description": "Habilidades técnicas para reparos, instalações e projetos 'faça você mesmo'.",
    "subcategories": [
      { 
        "title": "Ar Condicionado e Ventilação", 
        "tags": ["Gases (teoria)", "Instalação", "Limpeza", "Manutenção Preventiva", "Tipos de Aparelho"], 
        "icon": "mode_fan" 
      },
      { 
        "title": "Instalações Elétricas Residenciais", 
        "tags": ["Disjuntores", "Fiação", "Padrão", "Segurança Elétrica", "Tomadas"], 
        "icon": "power" 
      },
      { 
        "title": "Manutenção Hidráulica", 
        "tags": ["Caixa d'Água", "Desentupimento", "Reparo de Vazamentos", "Sifões", "Torneiras"], 
        "icon": "water_drop" 
      },
      { 
        "title": "Mecânica Básica Automotiva", 
        "tags": ["Bateria", "Luzes de Alerta", "Óleo e Fluidos", "Revisão", "Troca de Pneu"], 
        "icon": "directions_car" 
      },
      { 
        "title": "Montagem e Reparo de Móveis", 
        "tags": ["Ajustes", "Dobradiças", "Ferramentas", "Gavetas", "Instruções"], 
        "icon": "shelves" 
      },
      { 
        "title": "Pintura e Textura de Paredes", 
        "tags": ["Acabamento", "Pincéis e Rolos", "Preparação da Superfície", "Técnicas", "Tipos de Tinta"], 
        "icon": "format_paint" 
      },
      { 
        "title": "Revestimentos (Piso e Parede)", 
        "tags": ["Argamassa", "Assentamento", "Corte de Revestimento", "Nivelamento", "Rejunte"], 
        "icon": "texture" 
      },
      { 
        "title": "Serralheria e Solda (Iniciante)", 
        "tags": ["Cortes em Metal", "Equipamentos", "Segurança", "Estruturas", "Tipos de Solda"], 
        "icon": "iron" 
      },
      { 
        "title": "Sistemas de Segurança Residencial", 
        "tags": ["Alarmes", "Câmeras", "Cercas Elétricas (teoria)", "Configuração", "Instalação"], 
        "icon": "security" 
      },
      { 
        "title": "Uso de Ferramentas Elétricas", 
        "tags": ["Esmerilhadeira", "Furadeira", "Materiais", "Segurança", "Serra"], 
        "icon": "construction" 
      }
    ]
  },
  {
    "title": "Marketing Digital", 
    "icon": "campaign", 
    "description": "Estratégias para presença online, vendas e branding.",
    "subcategories": [
      { 
        "title": "Afiliados", 
        "tags": ["Comissão", "Divulgação", "Hotmart", "Nicho", "Produto Digital"], 
        "icon": "people" 
      },
      { 
        "title": "Análise de Métricas", 
        "tags": ["Decisão Baseada em Dados", "Google Analytics", "KPIs", "Relatórios", "ROI"], 
        "icon": "data_usage" 
      },
      { 
        "title": "Branding Pessoal", 
        "tags": ["Autoridade", "Marca Pessoal", "Networking", "Posicionamento", "Reputação"], 
        "icon": "person" 
      },
      { 
        "title": "Copywriting", 
        "tags": ["Chamada para Ação", "Gatilhos Mentais", "Oferta", "Persuasão", "Títulos"], 
        "icon": "auto_stories" 
      },
      { 
        "title": "E-mail Marketing", 
        "tags": ["Automação", "Copywriting", "Leads", "Nutrição", "Segmentação"], 
        "icon": "email" 
      },
      { 
        "title": "Inbound Marketing", 
        "tags": ["Atração", "Conteúdo de Valor", "Conversão", "Jornada do Cliente", "Relacionamento"], 
        "icon": "connect_without_contact" 
      },
      { 
        "title": "Marketing de Conteúdo", 
        "tags": ["Blog", "Edição", "Engajamento", "Pauta", "Storytelling"], 
        "icon": "edit_note" 
      },
      { 
        "title": "Mídias Sociais", 
        "tags": ["Algoritmo", "Criação de Conteúdo", "Estratégia", "Instagram", "TikTok"], 
        "icon": "group" 
      },
      { 
        "title": "SEO (Otimização para Busca)", 
        "tags": ["Conteúdo Web", "Google", "Palavras-chave", "Rankeamento", "Tráfego Orgânico"], 
        "icon": "search" 
      },
      { 
        "title": "Tráfego Pago", 
        "tags": ["Facebook Ads", "Funil de Vendas", "Google Ads", "Lançamento", "Remarketing"], 
        "icon": "paid" 
      }
    ]
  },
  {
    "title": "Moda e Estilo", 
    "icon": "checkroom", 
    "description": "Desenvolva sua imagem pessoal e conhecimento em moda.",
    "subcategories": [
      { 
        "title": "Análise de Cores (Coloração Pessoal)", 
        "tags": ["Cartela de Cores", "Combinações", "Estações", "Maquiagem", "Subtom"], 
        "icon": "colorize" 
      },
      { 
        "title": "Consultoria de Imagem (Básico)", 
        "tags": ["Comunicação Não Verbal", "Cores", "Estilos Pessoais", "Guarda-Roupa Inteligente", "Tipos de Corpo"], 
        "icon": "style" 
      },
      { 
        "title": "Cuidado com Cabelos", 
        "tags": ["Cronograma Capilar", "Finalização", "Produtos", "Tipos de Cabelo", "Tratamentos"], 
        "icon": "styler" 
      },
      { 
        "title": "Etiqueta (Social e Profissional)", 
        "tags": ["Apresentação", "Eventos", "Formalidades", "Mesa", "Postura"], 
        "icon": "back_hand" 
      },
      { 
        "title": "História da Moda", 
        "tags": ["Cultura", "Estilistas", "Revoluções", "Séculos", "Tendências"], 
        "icon": "local_library" 
      },
      { 
        "title": "Maquiagem (Automaquiagem)", 
        "tags": ["Contorno", "Olhos", "Pincéis", "Preparação de Pele", "Tendências"], 
        "icon": "face" 
      },
      { 
        "title": "Modelagem (Básica)", 
        "tags": ["Ajustes Simples", "Molde", "Recorte", "Tecidos", "Tirar Medidas"], 
        "icon": "square_foot" 
      },
      { 
        "title": "Montagem de Look", 
        "tags": ["Acessórios", "Combinações", "Cores", "Ocasiões", "Proporções"], 
        "icon": "accessibility" 
      },
      { 
        "title": "Personal Shopping", 
        "tags": ["Compras Inteligentes", "Curadoria", "Marcas", "Orçamento", "Pesquisa"], 
        "icon": "shopping_cart" 
      },
      { 
        "title": "Sustentabilidade na Moda", 
        "tags": ["Brechó", "Consumo Consciente", "Desperdício", "Materiais", "Upcycling"], 
        "icon": "recycling" 
      }
    ]
  },
  {
    "title": "Música", 
    "icon": "piano", 
    "description": "Aprenda a tocar instrumentos, teoria e produção musical.",
    "subcategories": [
      { 
        "title": "Canto (Técnicas Vocais)", 
        "tags": ["Afinação", "Aquecimento", "Cuidados com a Voz", "Projeção", "Respiração"], 
        "icon": "mic_external_on" 
      },
      { 
        "title": "Composição de Letras", 
        "tags": ["Estrutura", "Inspiração", "Métrica", "Rimas", "Storytelling"], 
        "icon": "lyrics" 
      },
      { 
        "title": "DJ (Iniciante)", 
        "tags": ["Beatmatching", "Controladora", "Mixagem", "Softwares (Rekordbox, Serato)", "Transições"], 
        "icon": "mixer" 
      },
      { 
        "title": "Gaita (Básica)", 
        "tags": ["Notas Simples", "Posição", "Repertório Fácil", "Respiração", "Ritmo"], 
        "icon": "music_video" 
      },
      { 
        "title": "Gravação Caseira", 
        "tags": ["Acústica Simples", "Edição", "Interface de Áudio", "Microfones", "Softwares Gratuitos"], 
        "icon": "settings_input_composite" 
      },
      { 
        "title": "Leitura de Partitura", 
        "tags": ["Alturas", "Andamento", "Claves", "Figuras Rítmicas", "Sinais de Expressão"], 
        "icon": "score" 
      },
      { 
        "title": "Produção de Beats", 
        "tags": ["Eletrônica", "Hip-Hop", "Loop", "Ritmo", "Sampler"], 
        "icon": "drums" 
      },
      { 
        "title": "Teclado e Piano (Básico)", 
        "tags": ["Acordes", "Escalas", "Leitura de Partitura", "Notação Musical", "Posição"], 
        "icon": "piano" 
      },
      { 
        "title": "Ukulele", 
        "tags": ["Acordes", "Afinação", "Batidas", "Músicas Simples", "Trocas"], 
        "icon": "toy_guitar" 
      },
      { 
        "title": "Violão (Iniciante)", 
        "tags": ["Acordes Básicos", "Cifras", "Dedilhado", "Postura", "Troca de Acordes"], 
        "icon": "guitars" 
      }
    ]
  },
  {
    "title": "Pet Care e Adestramento", 
    "icon": "pets", 
    "description": "Cuidados e técnicas para o bem-estar dos seus animais de estimação.",
    "subcategories": [
      { 
        "title": "Adestramento Básico (Cães)", 
        "tags": ["Coleira", "Comandos (Senta, Fica)", "Reforço Positivo", "Rotina", "Socialização"], 
        "icon": "dog" 
      },
      { 
        "title": "Adestramento de Gatos", 
        "tags": ["Arranhadores", "Caixa de Transporte", "Clicker Training", "Comandos", "Reforço Positivo"], 
        "icon": "pets" 
      },
      { 
        "title": "Alimentação Natural para Cães", 
        "tags": ["Nutrientes", "Receitas", "Restrições", "Transição", "Veterinário"], 
        "icon": "restaurant" 
      },
      { 
        "title": "Comportamento Destrutivo", 
        "tags": ["Ansiedade de Separação", "Latidos Excessivos", "Roer Móveis", "Soluções", "Treinamento"], 
        "icon": "delete_sweep" 
      },
      { 
        "title": "Comportamento Felino", 
        "tags": ["Arranhadores", "Brincadeiras", "Caixas de Areia", "Enriquecimento Ambiental", "Linguagem Corporal"], 
        "icon": "cat" 
      },
      { 
        "title": "Cuidados com Roedores", 
        "tags": ["Alimentação", "Espécies", "Gaiola", "Higiene", "Manuseio"], 
        "icon": "mouse" 
      },
      { 
        "title": "Higiene e Estética Animal", 
        "tags": ["Banho Seco", "Corte de Unhas", "Cuidados Específicos", "Escovação de Dentes", "Tosa Higiênica"], 
        "icon": "wash" 
      },
      { 
        "title": "Primeiros Socorros para Pets", 
        "tags": ["Emergências", "Engasgo", "Ferimentos", "Prevenção", "Vômito"], 
        "icon": "medical_services" 
      },
      { 
        "title": "Saúde Preventiva", 
        "tags": ["Check-ups", "Pulgas e Carrapatos", "Sintomas de Alerta", "Vacinas", "Vermífugos"], 
        "icon": "health_and_safety" 
      },
      { 
        "title": "Viagem com Animais", 
        "tags": ["Adaptação", "Checklist", "Documentação", "Segurança", "Transporte Aéreo/Terrestre"], 
        "icon": "flight" 
      }
    ]
  },
  {
    "title": "Saúde e Bem-Estar", 
    "icon": "favorite", 
    "description": "Conhecimento para uma vida mais saudável e equilibrada.",
    "subcategories": [
      { 
        "title": "Alívio de Estresse", 
        "tags": ["Escalas de Estresse", "Hobbies", "Respiração Profunda", "Rotina", "Técnicas de Relaxamento"], 
        "icon": "spa" 
      },
      { 
        "title": "Chás e Ervas Medicinais", 
        "tags": ["Armazenamento", "Contraindicações", "Indicações", "Preparo", "Propriedades"], 
        "icon": "local_cafe" 
      },
      { 
        "title": "Gerenciamento de Dor Crônica", 
        "tags": ["Exercícios Leves", "Gatilhos", "Hábitos", "Mindfulness", "Postura"], 
        "icon": "pain" 
      },
      { 
        "title": "Massagem (Técnicas Simples)", 
        "tags": ["Aromaterapia", "Auto-Massagem", "Óleos", "Pontos de Tensão", "Relaxamento"], 
        "icon": "back_hand" 
      },
      { 
        "title": "Nutrição (Básica)", 
        "tags": ["Alimentação Saudável", "Hidratação", "Leitura de Rótulos", "Macronutrientes", "Planejamento"], 
        "icon": "nutrition" 
      },
      { 
        "title": "Postura e Ergonomia", 
        "tags": ["Computador", "Levantar", "Prevenção de Dores", "Sentar", "Trabalho em Casa (Home Office)"], 
        "icon": "chair" 
      },
      { 
        "title": "Primeiros Socorros", 
        "tags": ["Emergências", "Engasgo", "Fraturas", "Queimaduras", "RCP (somente teoria)"], 
        "icon": "medical_services" 
      },
      { 
        "title": "Qualidade do Sono", 
        "tags": ["Ambientes", "Higiene do Sono", "Insônia", "Melatonina", "Rotina"], 
        "icon": "bedtime" 
      },
      { 
        "title": "Rotinas de Exercícios em Casa", 
        "tags": ["Alongamento", "Cardio", "Postura", "Segurança", "Treino com Peso Corporal"], 
        "icon": "directions_run" 
      },
      { 
        "title": "Yoga (Iniciante)", 
        "tags": ["Alinhamento", "Asanas (Poses)", "Filosofia", "Meditação", "Respiração (Pranayama)"], 
        "icon": "self_improvement" 
      }
    ]
  },
  {
    "title": "Sustentabilidade", 
    "icon": "eco", 
    "description": "Práticas e conhecimentos para um estilo de vida e negócios mais sustentáveis.",
    "subcategories": [
      { 
        "title": "Água (Uso e Reúso)", 
        "tags": ["Captação de Chuva", "Economia", "Filtros", "Reúso da Água Cinza", "Sustentabilidade Hídrica"], 
        "icon": "water_lux" 
      },
      { 
        "title": "Arquitetura Sustentável", 
        "tags": ["Bioconstrução", "Captação de Água", "Eficiência", "Iluminação Natural", "Materiais Ecológicos"], 
        "icon": "nature" 
      },
      { 
        "title": "Consumo Consciente", 
        "tags": ["Escolhas", "Impacto Ambiental", "Marcas Sustentáveis", "Minimalismo", "Slow Fashion"], 
        "icon": "shopping_cart" 
      },
      { 
        "title": "Criação de Cosméticos Naturais", 
        "tags": ["Artesanal", "Embalagens", "Ingredientes Orgânicos", "Receitas", "Sem Químicos"], 
        "icon": "spa" 
      },
      { 
        "title": "Cultivo Orgânico (Avançado)", 
        "tags": ["Adubação Verde", "Certificação", "Controle de Pragas Natural", "Permacultura", "Rotação de Culturas"], 
        "icon": "grass" 
      },
      { 
        "title": "Energias Renováveis (Introdução)", 
        "tags": ["Biomassa", "Custo-Benefício", "Eficiência Energética", "Eólica", "Solar"], 
        "icon": "bolt" 
      },
      { 
        "title": "Finanças Verdes e Investimento ESG", 
        "tags": ["Bancos Sustentáveis", "Fundos ESG", "Impacto Social", "Mercado", "Retorno Financeiro"], 
        "icon": "account_balance" 
      },
      { 
        "title": "Gestão de Resíduos (Lixo Zero)", 
        "tags": ["Compostagem", "Descarte Correto", "Reciclagem", "Redução", "Reuso"], 
        "icon": "delete_sweep" 
      },
      { 
        "title": "Mobilidade Sustentável", 
        "tags": ["Bicicleta", "Caminhada", "Carro Elétrico", "Redução de Carbono", "Transporte Público"], 
        "icon": "directions_bike" 
      },
      { 
        "title": "Turismo Sustentável", 
        "tags": ["Comunidades Locais", "Ecoturismo", "Respeito à Cultura", "Turismo Consciente", "Viagem Consciente"], 
        "icon": "hiking" 
      }
    ]
  },
  {
    "title": "Tecnologia", 
    "icon": "code", 
    "description": "Cursos sobre desenvolvimento, dados e infraestrutura.",
    "subcategories": [
      { 
        "title": "Análise de Dados", 
        "tags": ["Big Data", "Estatística", "Power BI", "Python", "SQL"], 
        "icon": "analytics" 
      },
      { 
        "title": "Automação de Processos", 
        "tags": ["Fluxos de Trabalho", "Macros", "Otimização", "Produtividade", "RPA"], 
        "icon": "automation" 
      },
      { 
        "title": "Blockchain e Criptomoedas", 
        "tags": ["Bitcoin", "Contratos Inteligentes", "Ethereum", "NFT", "Web3"], 
        "icon": "currency_bitcoin" 
      },
      { 
        "title": "Cibersegurança", 
        "tags": ["Firewall", "Hacking Ético", "LGPD", "Segurança de Redes", "Teste de Penetração"], 
        "icon": "security" 
      },
      { 
        "title": "Computação em Nuvem", 
        "tags": ["AWS", "Azure", "DevOps", "Google Cloud", "Kubernetes"], 
        "icon": "cloud" 
      },
      { 
        "title": "Design de Jogos", 
        "tags": ["Game Design", "Modelagem 3D", "Narrativa", "Unity", "Unreal Engine"], 
        "icon": "sports_esports" 
      },
      { 
        "title": "Desenvolvimento Mobile", 
        "tags": ["Android", "Flutter", "iOS", "React Native", "Swift"], 
        "icon": "smartphone" 
      },
      { 
        "title": "Desenvolvimento Web", 
        "tags": ["Backend", "CSS", "HTML", "JavaScript", "React"], 
        "icon": "web" 
      },
      { 
        "title": "Inteligência Artificial (IA)", 
        "tags": ["Algoritmos", "Automação", "ChatGPT", "Deep Learning", "Machine Learning"], 
        "icon": "robot" 
      },
      { 
        "title": "Lógica de Programação", 
        "tags": ["Algoritmos", "Estrutura de Dados", "Fluxograma", "Pensamento Computacional", "Resolução de Problemas"], 
        "icon": "settings_ethernet" 
      }
    ]
  },
  {
    "title": "Vídeo", 
    "icon": "videocam", 
    "description": "Captação, edição e produção de conteúdo audiovisual.",
    "subcategories": [
      { 
        "title": "Captação com Celular", 
        "tags": ["Aplicativos", "Áudio", "Dicas", "Estabilização", "Resolução"], 
        "icon": "mobile_friendly" 
      },
      { 
        "title": "Color Grading", 
        "tags": ["Ajustes Finos", "Correção de Cor", "Estilo", "LUTs", "Tons de Pele"], 
        "icon": "palette" 
      },
      { 
        "title": "Criação de Animação 2D", 
        "tags": ["After Effects", "Cenários", "Movimentos", "Personagens", "Voz Off"], 
        "icon": "animation" 
      },
      { 
        "title": "Edição de Vídeo (Iniciante)", 
        "tags": ["Cortes", "Exportação", "Programas (CapCut, DaVinci)", "Transições", "Trilha Sonora"], 
        "icon": "video_settings" 
      },
      { 
        "title": "Equipamentos (Básico)", 
        "tags": ["Câmeras", "Custos", "Lentes", "Microfones", "Tripé"], 
        "icon": "camera" 
      },
      { 
        "title": "Entrevistas em Vídeo", 
        "tags": ["Ambiente", "Áudio", "Perguntas", "Posição da Câmera", "Quebra-gelo"], 
        "icon": "forum" 
      },
      { 
        "title": "Iluminação para Vídeo", 
        "tags": ["Luz Natural", "Ring Light", "Sombras", "Softbox", "Três Pontos"], 
        "icon": "highlight" 
      },
      { 
        "title": "Roteiro para Vídeos Curtos", 
        "tags": ["Ganchos", "Reels", "Retenção", "Storytelling", "TikTok"], 
        "icon": "movie_edit" 
      },
      { 
        "title": "Voz Off e Narração", 
        "tags": ["Dicção", "Edição", "Equipamento de Áudio", "Interpretação", "Ritmo"], 
        "icon": "mic_none" 
      },
      { 
        "title": "Youtuber e Canais", 
        "tags": ["Criação de Conteúdo", "Monetização", "Nicho", "SEO para YouTube", "Thumbnails"], 
        "icon": "play_circle" 
      }
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