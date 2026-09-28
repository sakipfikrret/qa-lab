import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  Terminal, 
  ShieldCheck, 
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  BrainCircuit
} from 'lucide-react';
import { Project, CopilotMessage } from '../../types/qa';
import { api } from '../../services/api';
import { Markdown } from '../../lib/markdown';

interface QACopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const QACopilotDrawer: React.FC<QACopilotDrawerProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `I answer from the requirements, test cases, runs and bugs currently stored in this workspace. If something isn't recorded there, I'll say so.\n\nTry asking about edge cases, recent failures, or coverage gaps.`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Find missing edge cases in current suite',
    'Explain the most recent failed test',
        'Summarize latest staging test run',
    'Which requirements have no test cases?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.queryCopilot({
        message: textToSend.trim(),
        projectId: project.id,
        conversationHistory: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: CopilotMessage = {
        id: `msg-${Date.now()}-reply`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Copilot query error:', err);
      const errorMsg: CopilotMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `Error consulting QA Copilot: ${err.message}. Please verify backend status.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div role="dialog" aria-label="QA Copilot" className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#0c0e14] border-l border-white/[0.1] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#11141c]">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
            <BrainCircuit className="h-3.5 w-3.5 text-accent-400" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white">QA//LAB Copilot</h2>
            <p className="text-[11px] text-neutral-300 font-mono">Workspace: {project.name}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close Copilot"
          className="text-neutral-300 hover:text-white p-1 rounded hover:bg-white/[0.06] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs" aria-live="polite">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`p-3.5 rounded-lg leading-relaxed ${
                isUser
                  ? 'bg-white/[0.08] text-white ml-6 font-medium border border-white/[0.08]'
                  : 'bg-[#141720] text-neutral-200 mr-4 border border-white/[0.06]'
              }`}
            >
              {isUser ? <div className="whitespace-pre-wrap">{msg.content}</div> : <Markdown source={msg.content} />}
              <div className="text-[11px] text-neutral-400 font-mono mt-2 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#141720] border border-white/[0.06] text-neutral-300 text-xs mr-4">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-400" />
            <span>Reading your project data...</span>
          </div>
        )}
      </div>

      {/* Prompt Suggestions */}
      <div className="p-3 border-t border-white/[0.06] bg-[#0e1017]">
        <div className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider mb-2">
          Suggested Quality Queries:
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pb-1">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="text-xs px-2 py-1 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] rounded text-neutral-300 hover:text-white transition-all text-left truncate max-w-full"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer */}
      <div className="p-3 border-t border-white/[0.08] bg-[#11141c]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message the Copilot"
            placeholder="Ask about test cases, failures, or requirements..."
            className="flex-1 px-3 py-2 text-xs bg-[#090a0e] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25] placeholder:text-neutral-400"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || isLoading}
            className="p-2 text-neutral-950 bg-neutral-100 hover:bg-white disabled:opacity-40 rounded-md transition-all shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
