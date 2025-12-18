import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, BrainCircuit, Check, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid } from 'recharts';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    chartData?: any;
    chartType?: 'pie' | 'bar' | 'line';
    chartTitle?: string;
    intent?: string;
    actionResult?: string;
}

import { generateAIResponse } from '../services/aiService';

interface AetherChatbotProps {
    onAction?: (action: string, entityId: string, details?: string) => boolean;
}

export const AetherChatbot: React.FC<AetherChatbotProps> = ({ onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Systems online. I am Vector. Ready to analyze your logistics data.", sender: 'ai', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        // Call Real AI Service
        setInputValue('');
        setIsLoading(true);

        try {
            // Convert history for context
            // Convert history for context
            const history = messages.map(m => ({
                role: m.sender === 'ai' ? 'model' : 'user',
                content: m.text
            }));

            const rawResponse = await generateAIResponse(inputValue, history);
            let parsedResponse: any;

            try {
                parsedResponse = JSON.parse(rawResponse);
            } catch (e) {
                parsedResponse = { message: rawResponse };
            }

            // --- ACTION EXECUTION ---
            let actionResult = null;
            if (parsedResponse.intent && parsedResponse.entityId && onAction) {
                const success = onAction(parsedResponse.intent, parsedResponse.entityId, parsedResponse.actionDetails);
                if (success) {
                    actionResult = "Action Executed Successfully";
                }
            }

            const newAiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: parsedResponse.message || "Processed.",
                sender: 'ai',
                timestamp: new Date(),
                chartData: parsedResponse.chartData,
                chartType: parsedResponse.chartType,
                chartTitle: parsedResponse.chartTitle,
                intent: parsedResponse.intent,
                actionResult: actionResult || undefined
            };
            setMessages(prev => [...prev, newAiMessage]);

        } catch (error) {
            const errorMessage: Message = {
                id: Date.now().toString(),
                text: "Connection interrupted. Re-establishing vector link...",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* CHAT WINDOW */}
            {isOpen && (
                <div className="mb-4 w-80 h-96 bg-slate-900 border border-slate-700 rounded-sm shadow-2xl flex flex-col overflow-hidden pointer-events-auto font-mono">
                    {/* HEADER */}
                    <div className="p-4 bg-slate-950 flex justify-between items-center border-b border-slate-800">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-slate-800 border border-slate-700 flex items-center justify-center mr-3">
                                <span className="text-emerald-500 font-bold text-lg">{`>`}</span>
                            </div>
                            <div>
                                <h3 className="text-slate-100 font-bold text-sm tracking-wider uppercase">Vector</h3>
                                <p className="text-emerald-500 text-[10px] tracking-widest uppercase">AI Terminal</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-emerald-400 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* MESSAGES */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent bg-slate-900">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 text-xs leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                                    : 'bg-slate-950 text-emerald-400 border border-emerald-900/30 font-mono'
                                    }`}>
                                    <span className="opacity-50 text-[10px] uppercase block mb-1 tracking-wider">
                                        {msg.sender === 'user' ? 'USER' : 'VECTOR'}
                                    </span>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>

                                    {/* VISUAL RESPONSE RENDERER */}
                                    {msg.chartData && msg.chartType && (
                                        <div className="mt-4 bg-slate-900 p-2 rounded border border-slate-700 w-full h-40">
                                            {msg.chartTitle && <p className="text-[10px] font-bold mb-2 uppercase text-emerald-500">{msg.chartTitle}</p>}
                                            <ResponsiveContainer width="100%" height="100%">
                                                {msg.chartType === 'pie' ? (
                                                    <PieChart>
                                                        <Pie data={msg.chartData} innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value">
                                                            {msg.chartData.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color || ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'][index % 4]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', fontSize: '10px' }} itemStyle={{ color: '#E2E8F0' }} />
                                                    </PieChart>
                                                ) : (
                                                    <BarChart data={msg.chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                                        <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 9 }} />
                                                        <YAxis tick={{ fill: '#94A3B8', fontSize: 9 }} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', fontSize: '10px' }} cursor={{ fill: '#1E293B' }} />
                                                        <Bar dataKey="value" fill="#10B981" radius={[2, 2, 0, 0]} />
                                                    </BarChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* INPUT */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800">
                        <div className="relative flex items-center">
                            <span className="absolute left-3 text-emerald-500 font-bold">{`>`}</span>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Execute command..."
                                className="w-full bg-slate-900 text-slate-200 text-xs pl-8 pr-10 py-3 border border-slate-800 focus:outline-none focus:border-emerald-500/50 focus:ring-0 placeholder-slate-600 font-mono"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={isLoading}
                                className={`absolute right-2 p-1.5 text-slate-400 hover:text-emerald-500 transition-colors ${isLoading ? 'opacity-50' : ''}`}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOGGLE BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-slate-900 hover:bg-slate-800 rounded-sm shadow-xl flex items-center justify-center text-emerald-500 hover:text-emerald-400 transition-all duration-200 pointer-events-auto border border-slate-700"
            >
                {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
            </button>
        </div>
    );
};
