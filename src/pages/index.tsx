import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          Late Night Data Thoughts
        </Heading>
        <p className={styles.heroSubtitle}>
          Reflexões noturnas sobre dados, código e tecnologia.
        </p>
        <div className={styles.buttons}>
          <Link
            className={styles.heroButton}
            to="/blog">
            Ver Posts →
          </Link>
        </div>
      </div>
    </header>
  );
}

function RecentPosts(): ReactNode {
  const posts = [
    {
      slug: 'introducao-typescript',
      title: 'Introdução ao TypeScript para Desenvolvedores JavaScript',
      excerpt: 'TypeScript tem se tornado cada vez mais popular no ecossistema JavaScript. Neste artigo, exploramos os fundamentos e benefícios de adicionar tipagem estática ao seu código.',
      date: '5 de Fevereiro, 2026',
      readTime: '5 min de leitura',
    },
    {
      slug: 'react-server-components',
      title: 'React Server Components: O Futuro do React',
      excerpt: 'Server Components representam uma mudança fundamental na forma como construímos aplicações React. Vamos entender o que são e como funcionam.',
      date: '3 de Fevereiro, 2026',
      readTime: '7 min de leitura',
    },
    {
      slug: 'otimizacao-performance',
      title: 'Otimização de Performance em Aplicações Web',
      excerpt: 'Performance é crucial para a experiência do usuário. Descubra técnicas essenciais para otimizar suas aplicações web e melhorar métricas importantes.',
      date: '1 de Fevereiro, 2026',
      readTime: '6 min de leitura',
    },
  ];

  return (
    <section className={styles.postsSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Posts Recentes</h2>
        <div className={styles.postsList}>
          {posts.map((post) => (
            <article key={post.slug} className={styles.postCard}>
              <Link to={`/blog/${post.slug}`} className={styles.postLink}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postExcerpt}>{post.excerpt}</p>
                <span className={styles.postMeta}>{post.date} · {post.readTime}</span>
              </Link>
            </article>
          ))}
        </div>
        <div className={styles.viewAllWrapper}>
          <Link to="/blog" className={styles.viewAllLink}>
            Ver todos os posts →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="Artigos sobre desenvolvimento web, JavaScript, React e muito mais.">
      <HomepageHeader />
      <main>
        <RecentPosts />
      </main>
    </Layout>
  );
}
