import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const API_KEY: string = 'sk-svcacct-fBBveyUP2o22upuE0z6j8fcnPU7ipBkAttUgCGN4A5R6ZZaOgFtAhTmSYfCx-MWT3BlbkFJiPFpyTvMIiDQ9M1OZrcKGw3aViy0KX9ng6c1tvuQZvgPukcfxkV-NzL3gyOggAA';
const VECTOR_STORE_ID: string = 'vs_HNMSKYIjE4loN1u70tEGmixb';
const BASE_URL: string = 'https://api.openai.com/v1';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
  'OpenAI-Beta': 'assistants=v2'
};

// Cache assistant ID
let assistantId: string | null = null;

// Define expected request body type
interface ChatRequestBody {
  message: string;
}

// Define OpenAI response types
interface ThreadResponse {
  id: string;
}

interface RunResponse {
  id: string;
  status: string;
}

interface MessageResponse {
  messages: Array<{ id: string; content: string }>;
}

// Function to create an assistant (runs only once)
const createAssistant = async (): Promise<string> => {
  if (assistantId) return assistantId;

  const payload = {
    name: 'Engineering Assistant',
    instructions: 'You are a knowledgeable AI assistant specializing in transportation engineering RFQ proposals...',
    model: 'gpt-4o-mini',
    tools: [{ type: 'file_search' }],
    tool_resources: { file_search: { vector_store_ids: [VECTOR_STORE_ID] } },
    temperature: 0.42,
    top_p: 1.0
  };

  try {
    const response = await axios.post(`${BASE_URL}/assistants`, payload, { headers: HEADERS });
    assistantId = response.data.id;
    console.log('Assistant created:', assistantId);
    return assistantId as string;
  } catch (error: any) {
    console.error("Error creating assistant:", error.response?.data || error.message);
    throw new Error("Failed to create assistant.");
  }
};

// API Route Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message }: ChatRequestBody = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Ensure assistant exists
    assistantId = await createAssistant();

    // 1️⃣ Create a thread
    const threadResponse = await axios.post<ThreadResponse>(`${BASE_URL}/threads`, {}, { headers: HEADERS });
    const threadId = threadResponse.data.id;

    // 2️⃣ Add message to the thread
    await axios.post(`${BASE_URL}/threads/${threadId}/messages`, {
      role: 'user',
      content: message
    }, { headers: HEADERS });

    // 3️⃣ Start a run inside the thread
    const runResponse = await axios.post<RunResponse>(`${BASE_URL}/threads/${threadId}/runs`, {
      assistant_id: assistantId
    }, { headers: HEADERS });

    const runId = runResponse.data.id;

    // 4️⃣ Poll for completion
    let runStatus = runResponse.data.status;
    const terminalStatuses = ['completed', 'failed', 'cancelled', 'incomplete', 'expired'];

    while (!terminalStatuses.includes(runStatus)) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pollResponse = await axios.get<{ status: string }>(`${BASE_URL}/threads/${threadId}/runs/${runId}`, { headers: HEADERS });
      runStatus = pollResponse.data.status;
      console.log(`Polling run status: ${runStatus}`);
    }

    // 5️⃣ Retrieve messages from the thread
    const messagesResponse = await axios.get<MessageResponse>(`${BASE_URL}/threads/${threadId}/messages`, { headers: HEADERS });
    const messagesData = messagesResponse.data;

    return res.status(200).json({ messages: messagesData });
  } catch (error: any) {
    console.error("Chat API Error:", error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to process chat request.' });
  }
}
