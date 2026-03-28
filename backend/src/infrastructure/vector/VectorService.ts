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
      // Generate embedding for the query
      
      const queryEmbedding = await this.generateEmbedding(queryText);

      // Perform vector search using MongoDB's $vectorSearch aggregation
      const results = await Product.aggregate([
        {
          $vectorSearch: {
            index: "product_vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: limit * 10, // Consider more candidates for better results
            limit: limit,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            category: 1,
            quantity: 1,
            imageUrl: 1,
            vendor: 1,
            createdAt: 1,
            updatedAt: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]);

      return results;
    } catch (error) {
      console.error("Error searching products:", error);
      throw new Error("Failed to search products");
    }
  }
}

export default new VectorService();
