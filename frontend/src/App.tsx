import { useState, useRef, useEffect } from "react";
import "./App.css";

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
  prd_patch: Partial<PRD>;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/chat";

const STORAGE_KEY = "mini_prd_state_v1";

const INITIAL_PRD: PRD = {
  title: null,
  problem: null,
  proposed_solution: null,
  requirements: [],
  success_metrics: [],
  open_questions: [],
  status: "draft",
};

function mergePRD(current: PRD, patch: Partial<PRD>): PRD {
  const merged = { ...current };

  if (patch.title !== undefined && patch.title !== null) merged.title = patch.title;
  if (patch.problem !== undefined && patch.problem !== null) merged.problem = patch.problem;
  if (patch.proposed_solution !== undefined && patch.proposed_solution !== null) {
    merged.proposed_solution = patch.proposed_solution;
  }
  if (patch.status !== undefined && patch.status !== null) merged.status = patch.status;

  if (patch.requirements && Array.isArray(patch.requirements)) {
    merged.requirements = patch.requirements
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (patch.success_metrics && Array.isArray(patch.success_metrics)) {
    merged.success_metrics = patch.success_metrics
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  if (patch.open_questions && Array.isArray(patch.open_questions)) {
    const existing = merged.open_questions || [];
    const additions = patch.open_questions.map((s) => s.trim()).filter((s) => s.length > 0);
    const unique = [...existing];
    additions.forEach((item) => {
      if (!unique.includes(item)) unique.push(item);
    });
    merged.open_questions = unique;
  }

  return merged;
}

function IconChat() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconLightbulb() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

function IconCheckSquare() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.5 15a9 9 0 1 0 .5-5L1 10" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconHelpCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ChatMessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`message message--${msg.role}`}>
      <div className="message-avatar">
        {isUser ? "Y" : "AI"}
      </div>
      <div className="message-bubble">{msg.content}</div>
    </div>
  );
}

function PRDSection({
  label,
  icon,
  value,
  isTitle,
  editable,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value?: string | null;
  isTitle?: boolean;
  editable?: boolean;
  onChange?: (next: string) => void;
}) {
  return (
    <div className="prd-section">
      <div className="prd-section-label">
        {icon}
        {label}
      </div>
      {editable ? (
        isTitle ? (
          <input
            className="prd-edit-input prd-edit-input--title"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Add title..."
          />
        ) : (
          <textarea
            className="prd-edit-input prd-edit-input--textarea"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={`Add ${label.toLowerCase()}...`}
          />
        )
      ) : value ? (
        <div className={`prd-section-value${isTitle ? " prd-title-value" : ""}`}>
          {value}
        </div>
      ) : (
        <div className="prd-section-empty">Not yet defined</div>
      )}
    </div>
  );
}

function PRDListSection({
  label,
  icon,
  items,
  editable,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  items?: string[];
  editable?: boolean;
  onChange?: (next: string[]) => void;
}) {
  return (
    <div className="prd-section">
      <div className="prd-section-label">
        {icon}
        {label}
      </div>
      {editable ? (
        <textarea
          className="prd-edit-input prd-edit-input--textarea prd-edit-input--list"
          value={(items || []).join("\n")}
          onChange={(e) =>
            onChange?.(
              e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line.length > 0),
            )
          }
          placeholder={`One ${label.slice(0, -1).toLowerCase()} per line...`}
        />
      ) : items && items.length > 0 ? (
        <div className="prd-list">
          {items.map((item, i) => (
            <div key={i} className="prd-list-item">
              <span className="prd-list-bullet">{i + 1}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="prd-section-empty">No items yet</div>
      )}
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed.messages) ? parsed.messages : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [prd, setPrd] = useState<PRD>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_PRD;
    try {
      const parsed = JSON.parse(saved);
      return parsed.prd ? { ...INITIAL_PRD, ...parsed.prd } : INITIAL_PRD;
    } catch {
      return INITIAL_PRD;
    }
  });
  const [prdDraft, setPrdDraft] = useState<PRD | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const payload = {
      messages,
      prd,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [messages, prd]);


  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setPrd(INITIAL_PRD);
    setPrdDraft(null);
    setIsEditing(false);
    setInput("");
  };

  const startEditing = () => {
    setPrdDraft({
      ...prd,
      requirements: [...(prd.requirements || [])],
      success_metrics: [...(prd.success_metrics || [])],
      open_questions: [...(prd.open_questions || [])],
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setPrdDraft(null);
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (!prdDraft) return;
    const normalized: PRD = {
      ...prd,
      ...prdDraft,
      title: (prdDraft.title || "").trim() || null,
      problem: (prdDraft.problem || "").trim() || null,
      proposed_solution: (prdDraft.proposed_solution || "").trim() || null,
      requirements: (prdDraft.requirements || []).map((s) => s.trim()).filter((s) => s.length > 0),
      success_metrics: (prdDraft.success_metrics || []).map((s) => s.trim()).filter((s) => s.length > 0),
      open_questions: (prdDraft.open_questions || []).map((s) => s.trim()).filter((s) => s.length > 0),
    };
    setPrd(normalized);
    setPrdDraft(null);
    setIsEditing(false);
  };

  const buildMarkdown = () => {
    const listToMarkdown = (items?: string[]) => {
      if (!items || items.length === 0) return "- None";
      return items.map((item) => `- ${item}`).join("\n");
    };

    const title = (prd.title || "Mini PRD").trim();
    const problem = (prd.problem || "Not yet defined").trim();
    const proposedSolution = (prd.proposed_solution || "Not yet defined").trim();
    const status = ((prd.status || "draft").replace(/_/g, " ")).trim();

    return [
      `# ${title}`,
      "",
      `**Status:** ${status}`,
      "",
      "## Problem",
      problem,
      "",
      "## Proposed Solution",
      proposedSolution,
      "",
      "## Requirements",
      listToMarkdown(prd.requirements),
      "",
      "## Success Metrics",
      listToMarkdown(prd.success_metrics),
      "",
      "## Open Questions",
      listToMarkdown(prd.open_questions),
      "",
    ].join("\n");
  };

  const exportMarkdown = () => {
    const content = buildMarkdown();
    const safeBase = (prd.title || "mini-prd")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "mini-prd";
    const filename = `${safeBase}.md`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

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
    setPrd((prev) => mergePRD(prev, data.prd_patch));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleStatus = () => {
    if (isEditing && prdDraft) {
      setPrdDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: prev.status === "draft" ? "ready_for_review" : "draft",
        };
      });
      return;
    }

    setPrd((prev) => ({
      ...prev,
      status: prev.status === "draft" ? "ready_for_review" : "draft",
    }));
  };

  const activePrd = isEditing && prdDraft ? prdDraft : prd;
  const statusValue = (activePrd.status || "draft").toLowerCase();
  const statusLabel = statusValue.replace(/_/g, " ");

  return (
    <div className="app-layout">
      {/* ---- Chat Panel ---- */}
      <div className="chat-panel">
        <div className="chat-header">
          <div className="chat-header-icon">
            <IconChat />
          </div>
          <h2>Chat</h2>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <IconChat />
              </div>
              <p>Describe your feature idea to start building a PRD together.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatMessageBubble key={idx} msg={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your feature idea..."
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              aria-label="Send message"
            >
              <IconSend />
            </button>
          </div>
        </div>
      </div>

      <div className="prd-panel">
        <div className="prd-header">
          <div className="prd-header-left">
            <div className="prd-header-icon">
              <IconDocument />
            </div>
            <h2>Mini PRD</h2>
          </div>
          <div className="prd-header-right">
            {isEditing ? (
              <>
                <button className="prd-save-btn" onClick={saveEditing}>
                  <IconSave />
                  <span>Save</span>
                </button>
                <button className="prd-cancel-btn" onClick={cancelEditing}>
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button className="prd-edit-btn" onClick={startEditing}>
                  <IconEdit />
                  <span>Edit PRD</span>
                </button>
                <button className="prd-export-btn" onClick={exportMarkdown}>
                  <IconDownload />
                  <span>Export .md</span>
                </button>
                <button className="prd-reset-btn" onClick={resetAll}>
                  <IconReset />
                  <span>Reset</span>
                </button>
              </>
            )}
            <div
              className={`prd-status-badge clickable prd-status-badge--${statusValue}`}
              onClick={toggleStatus}
              role="button"
              tabIndex={0}
              aria-label={`Toggle status, current status ${statusLabel}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleStatus();
                }
              }}
            >
              <span className="prd-status-dot" />
              {statusLabel}
            </div>
          </div>

        </div>

        <div className="prd-content">
          <PRDSection
            label="Title"
            icon={<IconDocument />}
            value={activePrd.title}
            isTitle
            editable={isEditing}
            onChange={(next) =>
              setPrdDraft((prev) => ({
                ...(prev || activePrd),
                title: next,
              }))
            }
          />
          <PRDSection
            label="Problem"
            icon={<IconAlertCircle />}
            value={activePrd.problem}
            editable={isEditing}
            onChange={(next) =>
              setPrdDraft((prev) => ({
                ...(prev || activePrd),
                problem: next,
              }))
            }
          />
          <PRDSection
            label="Proposed Solution"
            icon={<IconLightbulb />}
            value={activePrd.proposed_solution}
            editable={isEditing}
            onChange={(next) =>
              setPrdDraft((prev) => ({
                ...(prev || activePrd),
                proposed_solution: next,
              }))
            }
          />
          <PRDListSection
            label="Requirements"
            icon={<IconCheckSquare />}
            items={activePrd.requirements}
            editable={isEditing}
            onChange={(next) =>
              setPrdDraft((prev) => ({
                ...(prev || activePrd),
                requirements: next,
              }))
            }
          />
          <PRDListSection
            label="Success Metrics"
            icon={<IconBarChart />}
            items={activePrd.success_metrics}
            editable={isEditing}
            onChange={(next) =>
              setPrdDraft((prev) => ({
                ...(prev || activePrd),
                success_metrics: next,
              }))
            }
          />
          <PRDListSection
            label="Open Questions"
            icon={<IconHelpCircle />}
            items={activePrd.open_questions}
            editable={isEditing}
            onChange={(next) =>
              setPrdDraft((prev) => ({
                ...(prev || activePrd),
                open_questions: next,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}

export default App;
