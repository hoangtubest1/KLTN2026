import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './ChatBot.css';

const QUICK_REPLIES = [
    '🏟️ Có sân gì?',
    '💰 Giá thuê sân?',
    '📅 Cách đặt lịch?',
    '⏰ Còn lịch trống?',
    '❌ Hủy đặt lịch?',
    '📞 Liên hệ hỗ trợ',
];

const WELCOME_MESSAGE = {
    role: 'bot',
    content: '👋 Xin chào! Tôi là trợ lý AI của **T&T Sport**.\n\nTôi có thể giúp bạn tìm sân, tra giá, hướng dẫn đặt lịch và nhiều hơn nữa. Hỏi tôi bất cứ điều gì nhé! 🏆',
    id: 'welcome',
};

// Format markdown-like bold (**text**) to <strong>
function formatMessage(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showBadge, setShowBadge] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { user } = useAuth();

    // Drag state
    const [pos, setPos] = useState({ x: null, y: null }); // null = dùng CSS default
    const dragRef = useRef({ dragging: false, startX: 0, startY: 0, initX: 0, initY: 0 });
    const btnRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setShowBadge(false);
        }
    }, [isOpen]);

    // Drag handlers
    const onDragStart = useCallback((clientX, clientY) => {
        const btn = btnRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        dragRef.current = {
            dragging: false,
            startX: clientX,
            startY: clientY,
            initX: rect.left,
            initY: rect.top,
        };
    }, []);

    const onDragMove = useCallback((clientX, clientY) => {
        const d = dragRef.current;
        const dx = clientX - d.startX;
        const dy = clientY - d.startY;
        if (!d.dragging && Math.hypot(dx, dy) < 5) return;
        d.dragging = true;

        const btn = btnRef.current;
        const size = btn ? btn.offsetWidth : 60;
        const newX = Math.max(8, Math.min(window.innerWidth - size - 8, d.initX + dx));
        const newY = Math.max(8, Math.min(window.innerHeight - size - 8, d.initY + dy));
        setPos({ x: newX, y: newY });
    }, []);

    const onDragEnd = useCallback((e) => {
        if (!dragRef.current.dragging) {
            // It's a tap — toggle chat
            setIsOpen(o => !o);
        }
        dragRef.current.dragging = false;
    }, []);

    // Mouse events
    const onMouseDown = useCallback((e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }, [onDragStart]);
    const onMouseMove = useCallback((e) => { if (dragRef.current.startX !== 0) onDragMove(e.clientX, e.clientY); }, [onDragMove]);
    const onMouseUp = useCallback((e) => { onDragEnd(e); dragRef.current.startX = 0; }, [onDragEnd]);

    // Touch events
    const onTouchStart = useCallback((e) => { const t = e.touches[0]; onDragStart(t.clientX, t.clientY); }, [onDragStart]);
    const onTouchMove = useCallback((e) => { e.preventDefault(); const t = e.touches[0]; onDragMove(t.clientX, t.clientY); }, [onDragMove]);
    const onTouchEnd = useCallback((e) => { onDragEnd(e); }, [onDragEnd]);

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    const sendMessage = async (text) => {
        const userMessage = text || input.trim();
        if (!userMessage || isLoading) return;

        setInput('');
        const userMsg = { role: 'user', content: userMessage, id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        // Build history (exclude welcome message)
        const history = messages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content }));

        try {
            const response = await fetch('http://localhost:5000/api/chatbot/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, history }),
            });

            if (!response.ok) throw new Error('Server error');

            const data = await response.json();
            const botMsg = {
                role: 'bot',
                content: data.reply,
                id: Date.now() + 1,
                source: data.source,
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: '⚠️ Xin lỗi, có lỗi kết nối. Vui lòng thử lại sau.',
                id: Date.now() + 1,
                source: 'error',
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleOpen = () => {
        setIsOpen(o => !o);
    };

    // Button style: dùng pos state nếu đã kéo, ngược lại dùng CSS fixed
    const btnStyle = pos.x !== null ? {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        right: 'auto',
        bottom: 'auto',
        zIndex: 9999,
        cursor: 'grab',
        touchAction: 'none',
    } : {
        cursor: 'grab',
        touchAction: 'none',
    };

    // Chat window bám theo icon
    const winStyle = pos.x !== null ? {
        position: 'fixed',
        left: Math.min(pos.x, window.innerWidth - 340),
        top: Math.max(8, pos.y - 480),
        right: 'auto',
        bottom: 'auto',
    } : {};

    return (
        <>
            {/* Floating Toggle Button — Draggable */}
            <button
                ref={btnRef}
                className="chatbot-toggle"
                style={btnStyle}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                title="Chat với AI tư vấn (giữ để di chuyển)"
                aria-label="Mở chat AI"
            >
                {showBadge && !isOpen && <span className="chatbot-badge" />}
                {isOpen ? (
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                ) : (
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" /></svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window" style={winStyle}>
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-avatar">🤖</div>
                        <div className="chatbot-header-info">
                            <h4>T&T Sport AI</h4>
                            <span><span className="status-dot" /> Đang hoạt động</span>
                        </div>
                        <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`chat-message ${msg.role}`}>
                                <div className="msg-avatar">
                                    {msg.role === 'bot' ? '🤖' : (user?.name?.[0]?.toUpperCase() || '👤')}
                                </div>
                                <div className="msg-bubble">
                                    {formatMessage(msg.content)}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="chat-message bot">
                                <div className="msg-avatar">🤖</div>
                                <div className="msg-bubble">
                                    <div className="typing-indicator">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    {messages.length <= 2 && !isLoading && (
                        <div className="chatbot-quick-replies">
                            {QUICK_REPLIES.map((q) => (
                                <button
                                    key={q}
                                    className="quick-reply-btn"
                                    onClick={() => sendMessage(q)}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="chatbot-input-area">
                        <textarea
                            ref={inputRef}
                            className="chatbot-input"
                            placeholder="Nhập câu hỏi của bạn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            className="chatbot-send-btn"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            title="Gửi"
                        >
                            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
