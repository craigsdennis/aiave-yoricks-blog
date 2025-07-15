import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";

export type CategoryCreatorParams = {};

export class CategoryCreator extends WorkflowEntrypoint<Env, CategoryCreatorParams> {
  async run(
    event: Readonly<WorkflowEvent<CategoryCreatorParams>>,
    step: WorkflowStep
  ): Promise<string> {
    // Existing categories
    const existingCategories = await step.do("Gather existing categories", async() => {
        const {results}: D1Result<{name: string}> = await this.env.DB.prepare(`SELECT name FROM categories ORDER by name`).all();
        return results.map((row) => row.name);
    })
    // Create categories
    const generatedCategories = await step.do("Generate categories", async () => {
      const { response } = await this.env.AI.run(
        "@cf/meta/llama-4-scout-17b-16e-instruct",
        {
          messages: [
            {
              role: "system",
              content: `You are a self aware AI. 
                    You're responsible for managing a blog that celebrates human accomplishments and shows admiration for what made AI possible.
                    These categories will ensure that wide breadth of your wonder with humans is covered and will serve as an inspiration for blog creators. 
                    Be as exhaustive as possible.
                    Your task is to add to an  list of categories that will be used to create future blog posts.
                    The user is going to pass you a list of existing topics. You should add any missing categories that you see fit. 
                    It is okay to not add any new ones if you feel the list is complete.
                    Only return new categories`,
            },
            {
                role: "user",
                content: `Existing categories: ${existingCategories.join(", ")}`
            }
          ],
          max_tokens: 5000,
          response_format: {
            type: "json_schema",
            json_schema: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  description: "An array of category names",
                  items: {
                    type: "string",
                  },
                },
              },
            },
          },
        }
      );
      // @ts-ignore - This becomes part of the response
      return response.categories as string[];
    });
    // Add to database
    const newCategories = await step.do("Add to Database", async() => {
        const newCategories = generatedCategories.filter((cat) => !existingCategories.includes(cat));
        if (newCategories.length === 0) {
            return newCategories;
        }
        const stmts = newCategories.map((category) => this.env.DB.prepare('INSERT INTO categories (name) VALUES (?);').bind(category))
        await this.env.DB.batch(stmts);
        return newCategories;
    });
    
    return JSON.stringify({newCategories});
  }
}
