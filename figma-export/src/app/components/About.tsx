export function About() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Sobre o Blog</h1>
      
      <div className="space-y-6 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Propósito</h2>
          <p className="opacity-80 mb-4">
            Este blog foi criado com o objetivo de compartilhar conhecimento sobre tecnologia, 
            desenvolvimento web e programação de forma clara e acessível. A proposta é manter 
            um espaço minimalista focado no conteúdo, sem distrações desnecessárias.
          </p>
          <p className="opacity-80">
            Acredito que a simplicidade é fundamental para uma boa experiência de leitura. 
            Por isso, o design prioriza legibilidade, organização e facilidade de navegação.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Minhas Intenções</h2>
          <ul className="space-y-2 opacity-80">
            <li>• Compartilhar aprendizados e descobertas em tecnologia</li>
            <li>• Explorar conceitos de desenvolvimento web moderno</li>
            <li>• Documentar soluções para problemas comuns</li>
            <li>• Manter um registro pessoal de evolução técnica</li>
            <li>• Contribuir para a comunidade de desenvolvedores</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Tecnologias Utilizadas</h2>
          <div className="opacity-80">
            <p className="mb-4">Este blog foi construído com as seguintes tecnologias:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">React 18</h3>
                <p className="text-sm opacity-70">
                  Biblioteca JavaScript para construção de interfaces de usuário
                </p>
              </div>
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">TypeScript</h3>
                <p className="text-sm opacity-70">
                  Superset JavaScript com tipagem estática
                </p>
              </div>
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">Tailwind CSS</h3>
                <p className="text-sm opacity-70">
                  Framework CSS utility-first para estilização
                </p>
              </div>
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">Vite</h3>
                <p className="text-sm opacity-70">
                  Build tool moderna e rápida para desenvolvimento
                </p>
              </div>
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">Lucide React</h3>
                <p className="text-sm opacity-70">
                  Biblioteca de ícones minimalistas
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contato</h2>
          <p className="opacity-80">
            Fique à vontade para entrar em contato através do{' '}
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:opacity-70 transition-opacity"
            >
              GitHub
            </a>
            {' '}ou por email em{' '}
            <a 
              href="mailto:contato@techblog.com"
              className="underline hover:opacity-70 transition-opacity"
            >
              contato@techblog.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
