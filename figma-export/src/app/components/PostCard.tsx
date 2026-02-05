interface PostCardProps {
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  onClick: () => void;
}

export function PostCard({ title, excerpt, date, readTime, onClick }: PostCardProps) {
  return (
    <article 
      onClick={onClick}
      className="border-b pb-6 mb-6 cursor-pointer hover:opacity-70 transition-opacity"
    >
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <div className="flex gap-3 text-sm opacity-60 mb-3">
        <time>{date}</time>
        <span>·</span>
        <span>{readTime}</span>
      </div>
      <p className="opacity-80 leading-relaxed">{excerpt}</p>
    </article>
  );
}
