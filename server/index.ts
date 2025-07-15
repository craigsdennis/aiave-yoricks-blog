import { Hono } from "hono";
import { CategoryCreator } from "./workflows/category-creator";
import { BlogPostCreator } from "./workflows/blog-post-creator";

export { CategoryCreator, BlogPostCreator };

export type PostSummary = {
  title: string;
  slug: string;
  created_at: string;
};

export interface Post extends PostSummary {
  content: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", async (c) => {
  return c.json({ name: "Cloudflare 🔥" });
});

app.get("/api/posts/latest", async (c) => {
  const { results }: D1Result<PostSummary> = await c.env.DB.prepare(
    `SELECT * FROM posts WHERE status='published' LIMIT 20 ORDER by creation_date DESC;`
  ).all();
  return c.json(results);
});

app.get("/api/posts/:slug", async (c) => {
  const { slug } = c.req.param();
  const { results }: D1Result<PostSummary> = await c.env.DB.prepare(
    `SELECT * FROM posts WHERE status='published' AND slug=?;`
  )
    .bind(slug)
    .all();
});

export default app;
