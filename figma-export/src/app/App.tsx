import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { PostView } from './components/PostView';
import { Sidebar } from './components/Sidebar';
import { About } from './components/About';
import { Footer } from './components/Footer';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  content: string;
  year: number;
  month: number;
}

const POSTS: Post[] = [
  {
    id: 1,
    title: "Introdução ao TypeScript para Desenvolvedores JavaScript",
    excerpt: "TypeScript tem se tornado cada vez mais popular no ecossistema JavaScript. Neste artigo, exploramos os fundamentos e benefícios de adicionar tipagem estática ao seu código.",
    date: "5 de Fevereiro, 2026",
    readTime: "5 min de leitura",
    year: 2026,
    month: 2,
    content: `TypeScript é um superset de JavaScript que adiciona tipagem estática opcional à linguagem. Desenvolvido pela Microsoft, ele compila para JavaScript puro, o que significa que pode ser executado em qualquer ambiente que suporte JavaScript.

A principal vantagem do TypeScript é a detecção de erros em tempo de desenvolvimento. Com a tipagem estática, muitos bugs que só seriam descobertos em produção podem ser identificados durante a escrita do código.

Além disso, o TypeScript oferece excelente suporte para autocompletar em editores modernos, tornando a experiência de desenvolvimento mais produtiva. A documentação implícita através dos tipos também facilita a manutenção de projetos maiores.

Para começar, basta instalar o TypeScript via npm e configurar o arquivo tsconfig.json com as opções desejadas. A curva de aprendizado é suave para quem já conhece JavaScript, e os benefícios compensam o investimento inicial.`
  },
  {
    id: 2,
    title: "React Server Components: O Futuro do React",
    excerpt: "Server Components representam uma mudança fundamental na forma como construímos aplicações React. Vamos entender o que são e como funcionam.",
    date: "3 de Fevereiro, 2026",
    readTime: "7 min de leitura",
    year: 2026,
    month: 2,
    content: `React Server Components (RSC) introduzem um novo paradigma no desenvolvimento de aplicações React. Diferente dos componentes tradicionais que são renderizados no cliente, os Server Components são renderizados exclusivamente no servidor.

Isso traz diversas vantagens: redução do bundle JavaScript enviado ao cliente, acesso direto a recursos do servidor como bancos de dados e sistemas de arquivos, e melhor performance inicial de carregamento.

Os Server Components podem ser mesclados com Client Components tradicionais na mesma árvore de componentes, oferecendo o melhor dos dois mundos. É importante entender quando usar cada tipo de componente para maximizar os benefícios.

Frameworks como Next.js já adotaram Server Components como padrão, e a tendência é que mais ferramentas do ecossistema React sigam esse caminho. Vale a pena começar a se familiarizar com esse conceito desde agora.`
  },
  {
    id: 3,
    title: "Otimização de Performance em Aplicações Web",
    excerpt: "Performance é crucial para a experiência do usuário. Descubra técnicas essenciais para otimizar suas aplicações web e melhorar métricas importantes.",
    date: "1 de Fevereiro, 2026",
    readTime: "6 min de leitura",
    year: 2026,
    month: 2,
    content: `A performance de uma aplicação web impacta diretamente a experiência do usuário e até mesmo o ranking em mecanismos de busca. Existem várias estratégias para otimizar suas aplicações.

Lazy loading de componentes e imagens é uma técnica fundamental. Carregar apenas o necessário inicialmente e adiar o carregamento de recursos não críticos melhora significativamente o tempo de carregamento inicial.

Minificação e compressão de assets também são essenciais. Ferramentas modernas de build como Vite e Webpack já fazem muito disso automaticamente, mas é importante configurá-las corretamente.

Caching inteligente, tanto no lado do cliente quanto do servidor, pode reduzir drasticamente o tempo de resposta em visitas subsequentes. Use Service Workers para controle fino sobre estratégias de cache.

Por fim, monitoramento constante usando ferramentas como Lighthouse e Web Vitals ajuda a identificar problemas e medir melhorias ao longo do tempo.`
  },
  {
    id: 4,
    title: "Git Avançado: Além do Básico",
    excerpt: "Git é mais poderoso do que muitos desenvolvedores imaginam. Explore comandos e técnicas avançadas para melhorar seu fluxo de trabalho.",
    date: "28 de Janeiro, 2026",
    readTime: "8 min de leitura",
    year: 2026,
    month: 1,
    content: `Embora a maioria dos desenvolvedores conheça os comandos básicos do Git como commit, push e pull, há muito mais poder escondido nessa ferramenta.

Git rebase interativo permite reescrever o histórico de commits de forma elegante. Você pode combinar commits, editar mensagens, reordenar mudanças e manter um histórico limpo e significativo.

Git bisect é uma ferramenta poderosa para debugging. Ele usa busca binária para identificar exatamente qual commit introduziu um bug, economizando horas de investigação manual.

Hooks do Git permitem automatizar tarefas em diferentes pontos do fluxo de trabalho. Pre-commit hooks podem executar linters e testes, enquanto post-merge hooks podem atualizar dependências automaticamente.

Compreender o modelo de dados do Git - objetos, árvores e commits - também ajuda a usar a ferramenta de forma mais eficaz e resolver situações complexas com confiança.`
  },
  {
    id: 5,
    title: "Tailwind CSS: Utility-First na Prática",
    excerpt: "Descubra como o Tailwind CSS revoluciona o desenvolvimento de interfaces com sua abordagem utility-first e como começar a usá-lo em seus projetos.",
    date: "15 de Janeiro, 2026",
    readTime: "5 min de leitura",
    year: 2026,
    month: 1,
    content: `Tailwind CSS adota uma abordagem diferente para estilização: ao invés de escrever CSS customizado, você compõe designs usando classes utilitárias pré-definidas.

Essa metodologia pode parecer estranha no início, mas oferece benefícios significativos em termos de consistência, velocidade de desenvolvimento e manutenibilidade.

O Tailwind elimina a necessidade de pensar em nomes de classes e reduz drasticamente o CSS não utilizado através de purging automático em produção.

Além disso, o framework é altamente customizável através do arquivo de configuração, permitindo que você defina seu próprio design system mantendo os benefícios da abordagem utility-first.`
  },
  {
    id: 6,
    title: "Fundamentos de Acessibilidade Web",
    excerpt: "Criar aplicações acessíveis não é opcional. Aprenda os princípios básicos para tornar suas aplicações utilizáveis por todos.",
    date: "20 de Dezembro, 2025",
    readTime: "7 min de leitura",
    year: 2025,
    month: 12,
    content: `Acessibilidade web garante que pessoas com deficiências possam usar suas aplicações. Isso inclui deficiências visuais, auditivas, motoras e cognitivas.

Semantic HTML é a base da acessibilidade. Use elementos apropriados (button, nav, main, etc) ao invés de divs genéricas sempre que possível.

ARIA attributes complementam o HTML quando necessário, mas não devem ser usados como substituto para HTML semântico correto.

Testes com leitores de tela e navegação por teclado são essenciais. Se você não consegue usar sua aplicação apenas com o teclado, há problemas de acessibilidade a corrigir.`
  },
  {
    id: 7,
    title: "Docker para Desenvolvedores Frontend",
    excerpt: "Containerização não é só para backend. Veja como Docker pode simplificar o desenvolvimento e deploy de aplicações frontend.",
    date: "5 de Dezembro, 2025",
    readTime: "6 min de leitura",
    year: 2025,
    month: 12,
    content: `Docker permite empacotar aplicações com todas as suas dependências em containers portáteis. Isso resolve o clássico problema "funciona na minha máquina".

Para aplicações frontend, Docker garante que todos os desenvolvedores usem as mesmas versões de Node, npm e outras ferramentas, eliminando inconsistências no ambiente.

Além disso, containerizar aplicações frontend facilita deploys e integração com pipelines de CI/CD. Você pode criar imagens otimizadas usando multi-stage builds.

Docker Compose permite orquestrar múltiplos containers, útil quando você precisa rodar frontend, backend e banco de dados localmente de forma integrada.`
  }
];

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<{ year: string; month: string } | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'about'>('home');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleNavigate = (page: 'home' | 'about') => {
    setCurrentPage(page);
    setSelectedPost(null);
  };

  // Agrupar posts por ano e mês
  const postsByYear = POSTS.reduce((acc, post) => {
    const year = String(post.year);
    const month = String(post.month);
    
    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][month]) {
      acc[year][month] = 0;
    }
    acc[year][month]++;
    
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Filtrar posts baseado na seleção
  const filteredPosts = selectedFilter
    ? POSTS.filter(
        (post) =>
          String(post.year) === selectedFilter.year &&
          String(post.month) === selectedFilter.month
      )
    : POSTS;

  // Ordenar posts por data (mais recente primeiro)
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-black dark:text-white transition-colors flex flex-col">
      <Header 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />
      
      {currentPage === 'about' ? (
        <div className="flex-1">
          <About />
        </div>
      ) : (
        <div className="flex max-w-7xl mx-auto flex-1">
          <Sidebar
            postsByYear={postsByYear}
            selectedFilter={selectedFilter}
            onFilterChange={(year, month) => {
              setSelectedFilter({ year, month });
              setSelectedPost(null);
            }}
            onClearFilter={() => setSelectedFilter(null)}
          />

          <main className="flex-1 px-6 py-12 max-w-4xl">
            {selectedPost ? (
              <PostView post={selectedPost} onBack={() => setSelectedPost(null)} />
            ) : (
              <>
                <div className="mb-12">
                  <h1 className="text-4xl font-bold mb-3">Blog de Tecnologia</h1>
                  <p className="opacity-70">
                    {selectedFilter
                      ? `Posts de ${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][Number(selectedFilter.month) - 1]} de ${selectedFilter.year}`
                      : 'Artigos sobre desenvolvimento web, JavaScript, React e muito mais.'}
                  </p>
                </div>
                
                <div>
                  {sortedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      title={post.title}
                      excerpt={post.excerpt}
                      date={post.date}
                      readTime={post.readTime}
                      onClick={() => setSelectedPost(post)}
                    />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      )}

      <Footer />
    </div>
  );
}