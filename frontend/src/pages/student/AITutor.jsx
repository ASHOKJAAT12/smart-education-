import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '../../services/aiService';
import { Bot, Send, Loader2, Sparkles, MessageCircle, AlertCircle, Plus } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ReactMarkdown from 'react-markdown';

const AITutor = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef(null);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [topicId, setTopicId] = useState(null); // In a fully baked app, you would pass this from Context or URL query map

    // Fetch conversation if ID provided
    const { data: convData, isLoading: convLoading } = useQuery({
        queryKey: ['ai-conversation', conversationId],
        queryFn: () => aiService.getConversationById(conversationId),
        enabled: !!conversationId,
    });

    useEffect(() => {
        if (convData?.data?.data) {
            setMessages(convData.data.data.messages || []);
        } else if (!conversationId) {
            setMessages([{ role: 'assistant', content: 'Hello! I am your AI Tutor. What would you like to learn today?' }]);
        }
    }, [convData, conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const chatMutation = useMutation({
        mutationFn: (data) => aiService.chat(data),
        onSuccess: (res) => {
            const data = res.data?.data;
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

            // If it was a new conversation, reroute to append ID (without reloading DOM)
            if (!conversationId && data.conversationId) {
                navigate(`/student/ai-tutor/${data.conversationId}`, { replace: true });
                queryClient.invalidateQueries(['ai-conversations']);
            }
        },
        onError: (err) => {
            setMessages(prev => [...prev, { role: 'assistant', content: err?.response?.data?.error || 'Oops, I am currently unavailable. Please try again soon!' }]);
        },
    });

    const handleSend = (e, overrideMessage = null) => {
        e?.preventDefault();
        const text = overrideMessage || input;
        if (!text.trim()) return;

        // Optimistically render
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setInput('');

        chatMutation.mutate({
            conversationId,
            topicId, // Optional bounding
            message: text
        });
    };

    const QUICK_ACTIONS = [
        "Explain it simply",
        "Give me a code example",
        "Quiz me on this",
        "What are common mistakes?"
    ];

    if (convLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden mt-4">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center">
                    <div className="bg-violet-500 rounded-full p-2 mr-3 border border-violet-400">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center">AI Tutor <Sparkles className="w-4 h-4 ml-2 text-yellow-300" /></h1>
                        <p className="text-xs text-slate-400">Your personalized educational assistent</p>
                    </div>
                </div>
                <button
                    onClick={() => { setMessages([{ role: 'assistant', content: 'What would you like to learn next?' }]); navigate('/student/ai-tutor') }}
                    className="flex items-center text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                    <Plus className="w-4 h-4 mr-1" /> New Chat
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0 border border-violet-200">
                                <Bot className="w-4 h-4 text-violet-600" />
                            </div>
                        )}
                        <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                            ? 'bg-violet-600 text-white rounded-tr-sm'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                            }`}>
                            {msg.role === 'user' ? (
                                <p className="text-sm font-medium">{msg.content}</p>
                            ) : (
                                <div className="text-sm prose prose-sm prose-slate max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {chatMutation.isLoading && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center mr-3 mt-1 border border-violet-200">
                            <Bot className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 flex items-center shadow-sm">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions Array */}
            {messages.length > 1 && !chatMutation.isLoading && (
                <div className="px-6 py-3 bg-white border-t border-slate-100 flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase mr-1 mt-1">Actions:</span>
                    {QUICK_ACTIONS.map(action => (
                        <button
                            key={action}
                            onClick={() => handleSend(null, action)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors font-medium border border-slate-200"
                        >
                            {action}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything about your studies..."
                        disabled={chatMutation.isLoading}
                        className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || chatMutation.isLoading}
                        className="absolute right-2 top-2 bg-violet-600 text-white p-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AITutor;
