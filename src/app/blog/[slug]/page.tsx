import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/blog";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Not Found | EdNoteAI Blog" };
  return {
    title: `${post.title} | EdNoteAI Blog`,
    description: post.description,
    keywords: post.keywords?.join(", ") || undefined,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <Link href="/blog" className="text-primary hover:underline mb-4 inline-block">&larr; Back to Blog</Link>
      <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
      <div className="text-sm text-muted-foreground mb-6">{new Date(post.date).toLocaleDateString()} &middot; {post.author}</div>
      <article className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </main>
  );
} 