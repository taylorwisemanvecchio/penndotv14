import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = 'sk-svcacct-fBBveyUP2o22upuE0z6j8fcnPU7ipBkAttUgCGN4A5R6ZZaOgFtAhTmSYfCx-MWT3BlbkFJiPFpyTvMIiDQ9M1OZrcKGw3aViy0KX9ng6c1tvuQZvgPukcfxkV-NzL3gyOggAA';
const VECTOR_STORE_ID = 'vs_HNMSKYIjE4loN1u70tEGmixb';
const BASE_URL = 'https://api.openai.com/v1';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
  'OpenAI-Beta': 'assistants=v2'
};

// Cache assistant ID
let assistantId: string | null = null;

// Function to create an assistant
const createAssistant = async (): Promise<string> => {
  if (assistantId) return assistantId;

  const payload = {
    name: 'Engineering Assistant',
    instructions: 'You are a knowledgeable AI assistant specializing in transportation engineering RFQ (Request for Qualification) proposals for our firm. Use provided data, project details, and industry best practices. Your role is to assist team members by: Taking input about a specific RFQ proposal, such as project type, scope, location, and client preferences, Analyzing the input against historical proposals and relevant information, and provide detailed, accurate, and actionable suggestions or answers to questions to aid in the creation of a proposal. Use clear and professional language in your responses. Always reference data from past proposals where relevant. If information is insufficient to provide a precise answer, suggest what additional information is needed and provide an educated inference. Always reference previous projects with their project number, example of this is E03926 and some information on its relevance. Provide as much detail as possible on past projects in each section.',
    model: 'gpt-4o-mini',
    tools: [{ type: 'file_search' }],
    tool_resources: { file_search: { vector_store_ids: [VECTOR_STORE_ID] } },
    temperature: 0.42,
    top_p: 1.0
  };

  const response = await axios.post(`${BASE_URL}/assistants`, payload, { headers: HEADERS });
  assistantId = response.data.id;
  return assistantId as string;
};

// 👇 Named export for POST requests
export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;

  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  try {
    const assistantId = await createAssistant();

    const threadResponse = await axios.post(`${BASE_URL}/threads`, {}, { headers: HEADERS });
    const threadId = threadResponse.data.id;

    await axios.post(`${BASE_URL}/threads/${threadId}/messages`, {
      role: 'user',
      content: message
    }, { headers: HEADERS });

    const runResponse = await axios.post(`${BASE_URL}/threads/${threadId}/runs`, {
      assistant_id: assistantId
    }, { headers: HEADERS });

    const runId = runResponse.data.id;

    let runStatus = runResponse.data.status;
    const terminalStatuses = ['completed', 'failed', 'cancelled', 'incomplete', 'expired'];

    while (!terminalStatuses.includes(runStatus)) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pollResponse = await axios.get<{ status: string }>(`${BASE_URL}/threads/${threadId}/runs/${runId}`, { headers: HEADERS });
      runStatus = pollResponse.data.status;
    }

    const messagesResponse = await axios.get(`${BASE_URL}/threads/${threadId}/messages`, { headers: HEADERS });
    const messagesData = messagesResponse.data;

    return NextResponse.json({ messages: messagesData });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: 'Failed to process chat request.' }, { status: 500 });
  }
}
