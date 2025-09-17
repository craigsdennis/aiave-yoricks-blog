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

export interface AdminPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published" | "archived";
  category_id: number;
  created_at: string;
  published_at: string | null;
  category: string;
}

export interface PostUpdateData {
  title?: string;
  content?: string;
  status?: "draft" | "published" | "archived";
  category_id?: number;
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

// Admin API endpoints
app.get("/api/admin/posts", async (c) => {
  const { results }: D1Result<AdminPost> = await c.env.DB.prepare(
    `SELECT posts.*, categories.name as 'category' FROM posts JOIN categories ON posts.category_id = categories.id WHERE status='draft' ORDER BY created_at DESC;`
  ).all();
  return c.json(results);
});

app.get("/api/admin/posts/:slug", async (c) => {
  const { slug } = c.req.param();
  const { results }: D1Result<AdminPost> = await c.env.DB.prepare(
    `SELECT posts.*, categories.name as 'category' FROM posts JOIN categories ON posts.category_id = categories.id WHERE slug=?;`
  )
    .bind(slug)
    .all();
  if (results.length === 0) {
    return c.notFound();
  }
  return c.json(results[0]);
});

app.put("/api/admin/posts/:slug", async (c) => {
  const { slug } = c.req.param();
  const updateData: PostUpdateData = await c.req.json();

  const updates = [];
  const values = [];

  if (updateData.title !== undefined) {
    updates.push("title = ?");
    values.push(updateData.title);
  }

  if (updateData.content !== undefined) {
    updates.push("content = ?");
    values.push(updateData.content);
  }

  if (updateData.status !== undefined) {
    updates.push("status = ?");
    values.push(updateData.status);

    if (updateData.status === "published") {
      updates.push("published_at = ?");
      values.push(new Date().toISOString());
    }
  }

  if (updateData.category_id !== undefined) {
    updates.push("category_id = ?");
    values.push(updateData.category_id);
  }

  if (updates.length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  values.push(slug);

  const query = `UPDATE posts SET ${updates.join(", ")} WHERE slug = ?`;

  try {
    await c.env.DB.prepare(query)
      .bind(...values)
      .run();

    // Return updated post
    const { results }: D1Result<AdminPost> = await c.env.DB.prepare(
      `SELECT posts.*, categories.name as 'category' FROM posts JOIN categories ON posts.category_id = categories.id WHERE slug=?;`
    )
      .bind(slug)
      .all();

    return c.json(results[0]);
  } catch (error) {
    return c.json({ error: "Failed to update post" }, 500);
  }
});

app.delete("/api/admin/posts/:slug", async (c) => {
  const { slug } = c.req.param();

  try {
    const result = await c.env.DB.prepare(`DELETE FROM posts WHERE slug = ?`)
      .bind(slug)
      .run();

    if (result.meta.changes === 0) {
      return c.notFound();
    }

    return c.json({ message: "Post deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete post" }, 500);
  }
});

// Get all categories for admin dropdown
app.get("/api/admin/categories", async (c) => {
  const { results }: D1Result<Category> = await c.env.DB.prepare(
    `SELECT * FROM categories ORDER BY name;`
  ).all();
  return c.json(results);
});

export default {
  fetch: app.fetch,
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    console.log("Time to make the donuts");
    ctx.waitUntil(env.BLOG_POST_CREATOR.create());
  },
};
