/**
 * VectorService
 *
 * This service handles OpenAI embeddings and MongoDB Atlas Vector Search.
 *
 * IMPORTANT: To use vector search, you must create an Atlas Search index in the MongoDB Atlas UI:
 * 1. Go to your cluster in Atlas UI
 * 2. Click "Search" in the left sidebar
 * 3. Click "Create Index"
 * 4. Select the "products" collection
 * 5. Choose "Create a vector search index"
 * 6. Set the index name to "product_vector_index"
 * 7. Add a field mapping for "embedding" with type "vector"
 * 8. Set dimensions to 1536 (required for text-embedding-3-small)
 * 9. Set similarity to "cosine"
 * 10. Click "Create Index"
 */

import OpenAI from "openai";
import { Product } from "../../models/Product";
import env from "../../config/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

class VectorService {
  /**
   * Generate an embedding for the given text using OpenAI's text-embedding-3-small model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      //TODO: langchain & text-embedding-3-large
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  /**
   * Search for products using vector similarity
   */
  async searchProducts(queryText: string, limit: number = 10): Promise<any[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(queryText);

      const vectorResults = await Product.aggregate([
        {
          $vectorSearch: {
            index: "product_vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: Math.max(limit * 10, 50),
            limit,
          },
        },
        {
          $project: {
            _id: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]);

      if (vectorResults.length === 0) {
        return [];
      }

      const idOrder = vectorResults.map((r) => r._id);
      const scoreById = new Map(
        vectorResults.map((r) => [r._id.toString(), r.score]),
      );

      const docs = await Product.find({
        _id: { $in: idOrder },
        embedding: { $exists: true, $ne: [] },
      })
        .select(
          "name description price category quantity imageUrl vendor createdAt updatedAt",
        )
        .lean();

      const docById = new Map(docs.map((d) => [d._id.toString(), d]));

      const ordered: any[] = [];
      for (const id of idOrder) {
        const doc = docById.get(id.toString());
        if (!doc) continue;
        ordered.push({
          ...doc,
          score: scoreById.get(id.toString()),
        });
      }
      return ordered;
    } catch (error) {
      console.error("Error searching products:", error);
      throw new Error("Failed to search products");
    }
  }
}

export default new VectorService();
