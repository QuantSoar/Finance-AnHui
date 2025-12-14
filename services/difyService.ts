
import { AgentResponse, FinancialAlgorithm } from "../types";

export const sendMessageToDify = async (
  query: string,
  config: { apiKey: string; baseUrl: string },
  conversationId?: string,
  user: string = "quant_user"
): Promise<{ response: AgentResponse; conversationId: string }> => {
  try {
    const url = `${config.baseUrl}/chat-messages`;
    
    // Construct the request body for Dify Chat API
    const body = {
      inputs: {},
      query: query,
      response_mode: "blocking", // Use blocking for simpler handling, streaming is also possible
      conversation_id: conversationId || "",
      user: user,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Dify API request failed");
    }

    const data = await res.json();
    const replyText = data.answer;
    const newConversationId = data.conversation_id;

    // Parse the response to find Code Blocks for updates
    // Dify usually returns Markdown. We look for ```python ... ```
    const updates = parseCodeFromMarkdown(replyText);

    return {
      response: {
        reply: replyText,
        updates: updates
      },
      conversationId: newConversationId
    };

  } catch (error) {
    console.error("Dify Service Error:", error);
    throw error;
  }
};

// Helper function to extract Python code from Markdown response
const parseCodeFromMarkdown = (text: string): Partial<FinancialAlgorithm> | undefined => {
  const pythonRegex = /```python([\s\S]*?)```/;
  const match = text.match(pythonRegex);

  if (match && match[1]) {
    const code = match[1].trim();
    // If code is found, we assume it's a code update
    return {
      pythonCode: code
    };
  }
  
  // Try generic block if python specific not found
  const genericRegex = /```([\s\S]*?)```/;
  const genMatch = text.match(genericRegex);
  if (genMatch && genMatch[1]) {
     // Check if it looks like python (imports or def)
     if (genMatch[1].includes('import') || genMatch[1].includes('def ')) {
        return { pythonCode: genMatch[1].trim() };
     }
  }

  return undefined;
};
