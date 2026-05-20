import React, { useState, useRef, useEffect } from 'react';
import api from '../api';

const AdminAIChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: '🤖 Xin chào Admin! Tôi là **Trợ lý AI Quản trị** của Timsan247.\n\nTôi có thể hỗ trợ bạn về:\n• 📊 Phân tích doanh thu, hiệu suất kinh doanh\n• 📅 Thống kê booking, tình trạng sân bãi\n• 👥 Quản lý người dùng, phân quyền\n• 💡 Tư vấn chiến lược phát triển\n• 🔧 Hỗ trợ vận hành hệ thống\n\nBạn muốn tìm hiểu về vấn đề gì?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Quick suggestion chips
  const suggestions = [
    { label: '📊 Tổng quan doanh thu', text: 'Cho tôi xem tổng quan doanh thu hệ thống' },
    { label: '📅 Thống kê booking hôm nay', text: 'Thống kê booking hôm nay như thế nào?' },
    { label: '🏆 Top sân phổ biến', text: 'Sân nào được đặt nhiều nhất? Phân tích chi tiết' },
    { label: '💡 Đề xuất cải thiện', text: 'Dựa trên dữ liệu hiện tại, bạn có đề xuất gì để tăng doanh thu?' },
    { label: '👥 Phân tích người dùng', text: 'Phân tích chi tiết về người dùng hệ thống' },
    { label: '⭐ Đánh giá & phản hồi', text: 'Tổng hợp đánh giá và phản hồi của khách hàng' },
  ];

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history (last 10 messages)
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'bot' ? 'bot' : 'user',
        content: m.content
      }));

      const res = await api.post('/admin/ai-chat', {
        message: trimmed,
        history
      });

      setMessages(prev => [...prev, {
        role: 'bot',
        content: res.data.reply,
        source: res.data.source
      }]);
    } catch (err) {
      console.error('Admin AI Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '⚠️ Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại.',
        isError: true
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'bot',
      content: '🤖 Đã xóa lịch sử chat. Bạn muốn hỏi gì?'
    }]);
  };

  // Simple markdown renderer
  const renderMarkdown = (text) => {
    if (!text) return '';

    let html = text
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Headers
      .replace(/^### (.+)$/gm, '<h4 class="text-sm font-bold text-gray-800 mt-3 mb-1">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="text-base font-bold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="text-lg font-bold text-gray-900 mt-4 mb-2">$1</h2>')
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.every(c => /^[\s-:]+$/.test(c))) return ''; // separator row
        const isHeader = cells.some(c => /^[\s-:]+$/.test(c));
        const tag = isHeader ? 'th' : 'td';
        const cellsHtml = cells.map(c => `<${tag} class="px-3 py-1.5 border border-gray-200 text-sm">${c.trim()}</${tag}>`).join('');
        return `<tr>${cellsHtml}</tr>`;
      })
      // Bullet points
      .replace(/^[•\-] (.+)$/gm, '<li class="ml-4 text-sm">$1</li>')
      // Line breaks
      .replace(/\n/g, '<br/>');

    // Wrap table rows
    if (html.includes('<tr>')) {
      html = html.replace(/(<tr>.*?<\/tr>(?:<br\/>)?)+/g, (match) => {
        const cleanMatch = match.replace(/<br\/>/g, '');
        return `<table class="w-full border-collapse my-2 text-sm">${cleanMatch}</table>`;
      });
    }

    // Wrap consecutive li items
    html = html.replace(/(<li[^>]*>.*?<\/li>(?:<br\/>)?)+/g, (match) => {
      const cleanMatch = match.replace(/<br\/>/g, '');
      return `<ul class="list-disc my-1">${cleanMatch}</ul>`;
    });

    return html;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              🤖
            </span>
            AI Hỗ Trợ Quản Trị
          </h2>
          <p className="text-xs text-gray-500 mt-1">Trợ lý thông minh phân tích dữ liệu & tư vấn quản lý</p>
        </div>
        <button
          onClick={clearChat}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition-all"
        >
          🗑️ Xóa chat
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
              {/* Avatar */}
              <div className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.isError
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                }`}>
                  {msg.role === 'user' ? '👤' : msg.isError ? '⚠️' : '🤖'}
                </div>

                {/* Bubble */}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : msg.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                      : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-md'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div
                      className="admin-ai-content prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  )}
                  {msg.source && msg.source !== 'vertex-ai' && (
                    <p className="text-[10px] mt-2 opacity-50">⚡ Trả lời nhanh (fallback)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                🤖
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">Đang phân tích dữ liệu...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(s.text)}
              disabled={loading}
              className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200 disabled:opacity-50 hover:shadow-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về doanh thu, thống kê, quản lý hệ thống..."
            disabled={loading}
            rows={1}
            className="w-full resize-none px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 transition-all placeholder-gray-400"
            style={{ minHeight: '48px', maxHeight: '120px' }}
            onInput={(e) => {
              e.target.style.height = '48px';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg active:scale-95"
          style={{
            background: input.trim() && !loading
              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : '#d1d5db'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AdminAIChat;
