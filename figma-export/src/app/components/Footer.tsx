export function Footer() {
  return (
    <footer className="border-t mt-16 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-60">
          <p>© 2026 tech.blog. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity"
            >
              GitHub
            </a>
            <a 
              href="mailto:contato@techblog.com" 
              className="hover:opacity-100 transition-opacity"
            >
              Contato
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
