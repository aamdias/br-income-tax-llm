import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX_NAME;

// Initialize Pinecone client
const pinecone = new Pinecone({ apiKey: pineconeApiKey })

const storeEmbeddingsInPinecone = async (textChunks, embeddings) => {
  const index = pinecone.Index(pineconeIndexName);

  for (let i = 0; i < textChunks.length; i++) {
    try {
      await index.upsert([
        {
          id: `document-${i}`,
          values: embeddings[i],
          metadata: { text: textChunks[i], source: 'tax-guide.pdf', chunk_index: i },
        },
      ]);
      console.log(`Document ${i} inserted into Pinecone`);
    } catch (error) {
      console.error('Error inserting document into Pinecone:', error);
    }
  }
};

const textChunks = JSON.parse(fs.readFileSync('text_chunks.json', 'utf-8'));
const embeddings = JSON.parse(fs.readFileSync('embeddings.json', 'utf-8'));

const main = async () => {
  await storeEmbeddingsInPinecone(textChunks, embeddings);
};

main().catch(console.error);
