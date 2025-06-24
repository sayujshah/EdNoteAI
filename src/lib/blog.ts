import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const postsDirectory = path.join(process.cwd(), 'src/content/blog');

export type BlogPostMeta = {
  title: string;
  description: string;
  date: string;
  author: string;
  slug: string;
  keywords?: string[];
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

export function getAllPostsMeta(): BlogPostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    return {
      ...(data as BlogPostMeta),
      slug,
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  // Configure marked for better markdown processing
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert line breaks to <br>
  });
  
  // Process content with marked (ensure it's a string)
  let htmlContent = await marked.parse(content);
  
  // Post-process to handle emojis with proper styling
  htmlContent = htmlContent
    .replace(/✅/g, '<span style="color: #16a34a; font-size: 1.1em;">✅</span>')
    .replace(/❌/g, '<span style="color: #dc2626; font-size: 1.1em;">❌</span>')
    .replace(/🎯/g, '<span style="font-size: 1.1em;">🎯</span>')
    .replace(/📚/g, '<span style="font-size: 1.1em;">📚</span>')
    .replace(/🎓/g, '<span style="font-size: 1.1em;">🎓</span>')
    .replace(/💡/g, '<span style="font-size: 1.1em;">💡</span>')
    .replace(/📊/g, '<span style="font-size: 1.1em;">📊</span>')
    .replace(/💰/g, '<span style="font-size: 1.1em;">💰</span>')
    .replace(/🚀/g, '<span style="font-size: 1.1em;">🚀</span>')
    .replace(/🔍/g, '<span style="font-size: 1.1em;">🔍</span>');
  
  return {
    ...(data as BlogPostMeta),
    slug,
    content: htmlContent,
  };
} 