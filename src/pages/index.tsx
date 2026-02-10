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
      slug: 'benchmarks-spark',
      title: 'Benchmarks úteis do Spark, por que você deve saber disso?',
      excerpt: 'Através destes benchmarks simples do spark eu pretendo ilustrar conceitos relativamente básicos sobre estratégias de leitura de dados, porém que vão te auxiliar a enxergar a arquitetura de processamento de dados com um olhar um pouco mais pragmático.',
      date: '9 de Fevereiro, 2026',
      readTime: '8 min de leitura',
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
