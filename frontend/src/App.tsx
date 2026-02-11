import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type PRD = {
  title?: string | null;
  problem?: string | null;
  proposed_solution?: string | null;
  requirements?: string[];
  success_metrics?: string[];
  open_questions?: string[];
  status?: string;
};

type ChatResponse = {
  assistant_message: string;
  clarifying_questions: string[];
  prd_patch: Partial<PRD>;
};

const API_URL = "http://localhost:8000/chat";

function mergePRD(current: PRD, patch: Partial<PRD>): PRD {
  const merged = { ...current };

  // Scalars overwrite
  ["title", "problem", "proposed_solution", "status"].forEach((key) => {
    const k = key as keyof PRD;
    if (patch[k] !== undefined && patch[k] !== null) {
      merged[k] = patch[k];
    }
  });

  // List fields append unique
  ["requirements", "success_metrics", "open_questions"].forEach((key) => {
    const k = key as keyof PRD;
    if (patch[k] && Array.isArray(patch[k])) {
      const existing = merged[k] || [];
      const additions = patch[k] as string[];
      const unique = [...existing];
      additions.forEach((item) => {
        if (!unique.includes(item)) unique.push(item);
      });
      merged[k] = unique;
    }
  });

  return merged;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [prd, setPrd] = useState<PRD>({
    title: null,
    problem: null,
    proposed_solution: null,
    requirements: [],
    success_metrics: [],
    open_questions: [],
    status: "draft",
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newUserMessage: ChatMessage = {
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput("");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        chat_history: updatedMessages,
        current_prd: prd,
      }),
    });

    const data: ChatResponse = await response.json();

    const newAssistantMessage: ChatMessage = {
      role: "assistant",
      content: data.assistant_message,
    };

    setMessages([...updatedMessages, newAssistantMessage]);

    // Merge PRD
    const merged = mergePRD(prd, data.prd_patch);
    setPrd(merged);
  };

  return (
    <div style={{ display: "flex", height: "100vh", padding: "20px", gap: "20px" }}>
      
      {/* Chat Panel */}
      <div style={{ flex: 1, border: "1px solid #ccc", padding: "10px" }}>
        <h2>Chat</h2>

        <div style={{ height: "70%", overflowY: "auto" }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: "10px" }}>
              <strong>{msg.role}:</strong> {msg.content}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "10px" }}>
          <input
            style={{ width: "80%", padding: "8px" }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your feature idea..."
          />
          <button onClick={sendMessage} style={{ padding: "8px" }}>
            Send
          </button>
        </div>
      </div>

      {/* PRD Panel */}
      <div style={{ flex: 1, border: "1px solid #ccc", padding: "10px" }}>
        <h2>Mini PRD</h2>

        <p><strong>Title:</strong> {prd.title}</p>
        <p><strong>Problem:</strong> {prd.problem}</p>
        <p><strong>Solution:</strong> {prd.proposed_solution}</p>

        <div>
          <strong>Requirements:</strong>
          <ul>
            {prd.requirements?.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>

        <div>
          <strong>Success Metrics:</strong>
          <ul>
            {prd.success_metrics?.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>

        <div>
          <strong>Open Questions:</strong>
          <ul>
            {prd.open_questions?.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>

        <p><strong>Status:</strong> {prd.status}</p>
      </div>
    </div>
  );
}

export default App;
