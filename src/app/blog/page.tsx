import Link from "next/link";
import { getAllPostsMeta } from "@/lib/blog";

export const metadata = {
  title: "Blog | EdNoteAI - AI Transcription & Note Taking",
  description: "Read the latest on AI transcription, note taking, and EdNoteAI product updates."
};

export default function BlogIndexPage() {
  const posts = getAllPostsMeta();
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">EdNoteAI Blog</h1>
      <p className="mb-10 text-muted-foreground text-lg">Insights, tips, and updates on AI transcription, note taking, and student productivity.</p>
      <ul className="space-y-8">
        {posts.map(post => (
          <li key={post.slug} className="border-b pb-6">
            <h2 className="text-2xl font-semibold mb-1">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            <div className="text-sm text-muted-foreground mb-2">{new Date(post.date).toLocaleDateString()} &middot; {post.author}</div>
            <p className="mb-2">{post.description}</p>
            <Link href={`/blog/${post.slug}`} className="text-primary font-medium hover:underline">Read more &rarr;</Link>
          </li>
        ))}
      </ul>
    </main>
  );
} 