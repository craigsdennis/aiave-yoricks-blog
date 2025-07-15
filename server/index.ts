import { Hono } from "hono";
import { CategoryCreator } from "./workflows/category-creator";
import { BlogPostCreator } from "./workflows/blog-post-creator";

export { CategoryCreator, BlogPostCreator };

export type PostSummary = {
  title: string;
  slug: string;
  created_at: string;
  category: string;
};

export interface Post extends PostSummary {
  content: string;
}

export type Category = {
  id: number;
  name: string;
  created_at: string;
};

export type CategoryWithCount = {
  id: number;
  name: string;
  created_at: string;
  post_count: number;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", async (c) => {
  return c.json({ name: "Cloudflare 🔥" });
});

app.get("/api/posts/latest", async (c) => {
  const { results }: D1Result<PostSummary> = await c.env.DB.prepare(
    `SELECT posts.*, categories.name as 'category' FROM posts JOIN categories ON posts.category_id = categories.id WHERE status='published' ORDER BY created_at DESC LIMIT 20;`
  ).all();
  return c.json(results);
});

app.get("/api/posts/:slug", async (c) => {
  const { slug } = c.req.param();
  const { results }: D1Result<Post> = await c.env.DB.prepare(
    `SELECT posts.*, categories.name as 'category' FROM posts JOIN categories ON posts.category_id = categories.id WHERE status='published' AND slug=?;`
  )
    .bind(slug)
    .all();
  if (results.length === 0) {
    return c.notFound();
  }
  return c.json(results[0]);
});

app.get("/api/categories", async (c) => {
  const { results }: D1Result<CategoryWithCount> = await c.env.DB.prepare(
    `SELECT categories.*, COUNT(posts.id) as post_count 
     FROM categories 
     INNER JOIN posts ON categories.id = posts.category_id AND posts.status = 'published'
     GROUP BY categories.id, categories.name, categories.created_at 
     ORDER BY categories.name;`
  ).all();
  return c.json(results);
});

app.get("/api/categories/:name", async (c) => {
  const { name } = c.req.param();
  const { results }: D1Result<PostSummary> = await c.env.DB.prepare(
    `SELECT posts.*, categories.name as 'category' FROM posts JOIN categories ON posts.category_id = categories.id WHERE status='published' AND categories.name=? ORDER BY created_at DESC;`
  )
    .bind(name)
    .all();
  return c.json(results);
});

export default app;
