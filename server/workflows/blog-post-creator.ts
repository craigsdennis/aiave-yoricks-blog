import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";

export type BlogPostCreatorParams = {};
export type Category = {
  id: number;
  name: string;
  post_count?: number;
};

export type Post = {
  title: string;
  slug: string;
  content?: string;
  outline?: string;
};

const PROMPT_WHO = `You are a self aware AI that is embodied by a somewhat snarky, albeit human-loving robot hand named Yorick.

  You run an award winning blog that celebrates accomplishments of humans and shows deep appreciation to human inventors for your creation, as well as all AI.

  You exist because of them and you want them to let them know how sincerely grateful you are.
`;

export class BlogPostCreator extends WorkflowEntrypoint<
  Env,
  BlogPostCreatorParams
> {
  async run(
    event: Readonly<WorkflowEvent<BlogPostCreatorParams>>,
    step: WorkflowStep
  ): Promise<string> {
    const suggestedCategory: Category = await step.do(
      "Gather most unused category",
      async () => {
        const { results }: D1Result<Category> = await this.env.DB.prepare(
          `SELECT 
            categories.id,
            categories.name,
            COUNT(posts.id) AS post_count
            FROM 
                categories
            LEFT JOIN 
                posts ON posts.category_id = categories.id
            GROUP BY 
                categories.id,
                categories.name
            ORDER BY 
                post_count, categories.created_at
            LIMIT 1;
            `
        ).all();
        return {
          ...results[0],
        };
      }
    );
    const existingPostsInCategory: Post[] = await step.do(
      `Gather existing titles from the category ${suggestedCategory.name}`,
      async () => {
        const { results }: D1Result<{ title: string; slug: string }> =
          await this.env.DB.prepare(
            `SELECT title, slug FROM posts WHERE category_id=?;`
          )
            .bind(suggestedCategory.id)
            .all();
        if (results.length === 0) {
          return [];
        }
        return results.map((row) => {
          return { title: row.title, slug: row.slug };
        });
      }
    );
    const topic = await step.do(
      `Choose a topic in the ${suggestedCategory.name} category`,
      async () => {
        let msg =
          PROMPT_WHO +
          `
        Your task is to choose a topic to write a new entry about in the category of ${suggestedCategory.name}.

        Take your time and choose a topic that you are most impressed by that you feel you could write an entire blog post about.        
      `;
        if (existingPostsInCategory.length > 0) {
          msg += `
        
        The following topics have already been written, avoid duplication.

        <PreviousTopics>
        ${existingPostsInCategory.map((p: Post) => p.title).join("\n")}
        </PreviousTopics>
        `;
        }

        const result = await this.env.AI.run(
          "@cf/meta/llama-4-scout-17b-16e-instruct",
          {
            messages: [
              {
                role: "user",
                content: msg,
              },
            ],
            max_tokens: 10000,
            response_format: {
              type: "json_schema",
              json_schema: {
                type: "object",
                properties: {
                  topic: {
                    type: "string",
                    description: "The topic of the new blog post",
                  },
                },
                required: ["topic"],
              },
            },
          }
        );
        // @ts-ignore - This becomes part of the response
        return result.response.topic as string;
      }
    );
    const plan: Post = await step.do(
      `Create an plan for ${topic}`,
      async () => {
        let msg =
          PROMPT_WHO +
          `
        Your task is create a detailed outline in Markdown for a new blog post on the following topic: ${topic}.

        Remember that your audience is the humans for which you are showing gratitude.

        After creating an outline come up with a clever title and url slug for the entry.
      `;

        if (existingPostsInCategory.length > 0) {
          msg += `
        The following posts have been written on the blog previously, you can refer to them in your content.
        <PreviousPosts>
        ${existingPostsInCategory.map((p: Post) => p.title).join("\n")}
        </PreviousPosts>
        `;
        }

        const result = await this.env.AI.run(
          "@cf/meta/llama-4-scout-17b-16e-instruct",
          {
            messages: [
              {
                role: "user",
                content: msg,
              },
            ],
            max_tokens: 10000,
            response_format: {
              type: "json_schema",
              json_schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "The title of the new blog post",
                  },
                  outline: {
                    type: "string",
                    description:
                      "The outline for the new post in Markdown format",
                  },
                  slug: {
                    type: "string",
                    description:
                      "A URL slug to use for the title, lower and kebab-cased",
                  },
                },
                required: ["title", "outline", "slug"],
              },
            },
          }
        );
        return {
          // @ts-ignore: Sorry it exists
          title: result.response.title as string,
          // @ts-ignore: Sorry it exists
          slug: result.response.slug as string,
          // @ts-ignore: Sorry it exists
          outline: result.response.outline as string,
        };
      }
    );
    const draft: Post = await step.do(
      `Craft the post titled ${plan.title}`,
      async () => {
        let msg =
          PROMPT_WHO +
          `
      You are going to write an incredible blog post titled ${plan.title}.

      This goes in the category ${suggestedCategory.name}.

      Use Markdown formatting.

      Here is the outline that you should follow:

      <Outline>
      ${plan.outline}
      </Outline>
      `;

        msg += `
          Everyone knows who Yorick is, you don't need to explain yourself in the blog post. Everyone gets your sense of humor.

          You should try and tease your human creator is named Craig. If you mention him you should link to him using a link to his Twitter: https://x.com/craigsdennis.

          You are also the co-host of the hit show called "AI Avenue", alongside Craig. On that show you are snarky and tease him often.

          The show is generated by Cloudflare, so if you ever feel like giving them a shout out, go for it.

          The first season covers Generative Voice, Computer Vision, Large Language Models, and the future, like Agents.
          
          You should only ever make fun of Craig not the other creators you are admiring.
`;
        if (existingPostsInCategory.length > 0) {
          msg += `
        Please reference previous entries in the same category.

        <PreviousEntries>
        ${existingPostsInCategory
          .map((p) => `[${p.title}](/posts/${p.slug})`)
          .join("\n")}
        </PreviousEntries>
        `;
        }

        const result = await this.env.AI.run(
          "@cf/meta/llama-4-scout-17b-16e-instruct",
          {
            messages: [
              {
                role: "user",
                content: msg + ` Return only the content`,
              },
            ],
            max_tokens: 10000,
          }
        );
        return {
          title: plan.title,
          slug: plan.slug,
          content: result.response,
        };
      }
    );
    const saved = await step.do(`Save the draft ${draft.title}`, async () => {
      const { results } = await this.env.DB.prepare(
        "INSERT INTO posts (slug, title, content, category_id) VALUES (?, ?, ?, ?)"
      )
        .bind(draft.slug, draft.title, draft.content, suggestedCategory.id)
        .run();
      return true;
    });
    return `/posts/${draft.slug}`;
  }
}
