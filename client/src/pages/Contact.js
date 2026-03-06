import React from 'react';

const Contact = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">Liên Hệ</h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full mb-4"></div>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Bạn có câu hỏi hoặc cần hỗ trợ? Hãy liên hệ với chúng tôi qua các kênh dưới đây.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Info Cards */}
                    <div className="space-y-6">
                        {[
                            {
                                icon: '📍',
                                title: 'Địa chỉ',
                                content: '123 Đường Thể Thao, Quận 1, TP.HCM',
                                color: 'from-blue-500 to-blue-600'
                            },
                            {
                                icon: '📞',
                                title: 'Điện thoại',
                                content: '0123 456 789',
                                link: 'tel:0123456789',
                                color: 'from-green-500 to-green-600'
                            },
                            {
                                icon: '✉️',
                                title: 'Email',
                                content: 'contact@ttsport.vn',
                                link: 'mailto:contact@ttsport.vn',
                                color: 'from-amber-500 to-orange-500'
                            },
                            {
                                icon: '🕐',
                                title: 'Giờ làm việc',
                                content: 'Thứ 2 - Chủ nhật: 05:00 - 22:00',
                                color: 'from-purple-500 to-purple-600'
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-md p-6 flex items-start gap-4 hover:shadow-lg transition-shadow">
                                <div className={`bg-gradient-to-br ${item.color} text-white w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">{item.title}</h3>
                                    {item.link ? (
                                        <a href={item.link} className="text-gray-900 font-medium hover:text-blue-600 transition-colors">
                                            {item.content}
                                        </a>
                                    ) : (
                                        <p className="text-gray-900 font-medium">{item.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white rounded-2xl shadow-md p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Gửi tin nhắn</h2>
                        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.'); }}>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nguyễn Văn A"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="email@example.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung</label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Nhập nội dung tin nhắn..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Gửi tin nhắn
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
