import { Pinecone, QueryResponse } from "@pinecone-database/pinecone";
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// Optional, but recommended: run on the edge runtime.
export const runtime = 'edge';

const pineconeApiKey = process.env.PINECONE_API_KEY || ""; // Assign an empty string as default value if the environment variable is undefined

console.log('pineconeApiKey', pineconeApiKey);

const pinecone = new Pinecone({apiKey: pineconeApiKey});
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

type RetrieveDocumentsParams = {
    vector: number[];
}

async function retrieveDocuments(query: RetrieveDocumentsParams) {
    const index = pinecone.index("tax-documents");

    const results: QueryResponse = await index.query({
        topK: 5,
        vector: query.vector,
        includeMetadata: true
    });

    return results.matches.map((match) => match.metadata?.text);
}

const generateSingleEmbedding = async (text: string) => {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, ' ')
        });

        const embedding = response.data[0].embedding;
        console.log('Embedding generated for text:', embedding);
        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
};

export async function POST(req: Request) {

    if (req.headers.get('Content-Type') !== 'application/json') {
        return new Response('Invalid Content-Type', { status: 400 });
    }

    try {
        const body = await req.json();

        const messages = body.messages;
        const currentMessageContent = messages[messages.length - 1].content;

        // Generate embedding for the message
        const messageEmbedding = await generateSingleEmbedding(currentMessageContent);

        // Retrieve documents
        const documents = await retrieveDocuments({ vector: messageEmbedding });

        // Chat completion
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'assistant', content: `Responda a pergunta do usuário com base no seguinte dumento: ${documents}. Cite treçhos originais da fonte na resposta. 
                Se refira ao documento como a Central de Perguntas e Respostas da declaração de imposto de renda de 2024 da receita federal do Brasil.
                Gere respostas completas, sempre citando valores e critérios do documento original. O usuário não deve precisar recorrer a fonte original para 
                ter que responder a sua pergunta.`},
                { role: 'user', content: currentMessageContent }
            ],
            temperature: 0,
            stream: true
        });

        // Convert the response into a friendly text-stream
        const stream = OpenAIStream(response);

        // Respond with the stream
        return new StreamingTextResponse(stream);
    } catch (error) {
        console.error('Error handling request:', error);
        return new Response('Error handling request', { status: 500 });
    }
}
