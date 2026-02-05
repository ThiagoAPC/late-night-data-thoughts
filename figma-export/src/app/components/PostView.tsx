import { ArrowLeft } from 'lucide-react';

interface Post {
  id: number;
  title: string;
  date: string;
  readTime: string;
  content: string;
}

interface PostViewProps {
  post: Post;
  onBack: () => void;
}

export function PostView({ post, onBack }: PostViewProps) {
  return (
    <article className="max-w-3xl mx-auto px-6 py-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 mb-8 hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={18} />
        <span>Voltar</span>
      </button>
      
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex gap-3 text-sm opacity-60">
          <time>{post.date}</time>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>
      </header>
      
      <div className="prose prose-lg max-w-none">
        {post.content.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-4 leading-relaxed opacity-90">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
