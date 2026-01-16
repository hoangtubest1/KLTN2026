import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-white hover:text-gray-200 mb-4 flex items-center gap-2 transition-colors"
                        >
                            ← Quay lại
                        </button>
                        <h1 className="text-3xl font-bold text-white">QUY CHẾ HOẠT ĐỘNG</h1>
                        <p className="text-blue-100 mt-2">Nền tảng đặt sân trực tuyến T&T SPORT</p>
                    </div>

                    {/* Content */}
                    <div className="px-8 py-8 space-y-8">
                        {/* Introduction */}
                        <section>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                <strong>T&T SPORT</strong> là nền tảng đặt sân trực tuyến phục vụ thương nhân, tổ chức, cá nhân có nhu cầu tạo gian hàng trực tuyến để giới thiệu và đăng tin cho thuê sân tập, cơ sở thể dục của mình.
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                T&T SPORT được xây dựng nhằm hỗ trợ tối đa cho khách hàng muốn tìm hiểu thông tin trực tuyến về sân luyện tập, thi đấu thể dục thể thao khác nhau hoặc có nhu cầu đặt thuê sân trực tuyến.
                            </p>
                        </section>

                        {/* Section I */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                                I. Nguyên tắc chung
                            </h2>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p>
                                    Nền tảng đặt sân trực tuyến T&T SPORT thực hiện hoạt động và vận hành. Thành viên trên Nền tảng đặt sân trực tuyến là các thương nhân, tổ chức, cá nhân có hoạt động thương mại hợp pháp được T&T SPORT chính thức công nhận và được phép sử dụng dịch vụ do Nền tảng đặt sân trực tuyến T&T SPORT và các bên liên quan cung cấp.
                                </p>
                                <p>
                                    Nguyên tắc này áp dụng cho các thành viên đăng ký sử dụng, tạo lập gian hàng giới thiệu, buôn bán sản phẩm/dịch vụ hoặc khuyến mại sản phẩm/dịch vụ được thực hiện trên Nền tảng đặt sân trực tuyến T&T SPORT.
                                </p>
                                <p>
                                    Thương nhân, tổ chức, cá nhân tham gia giao dịch tại Nền tảng đặt sân trực tuyến T&T SPORT tự do thỏa thuận trên cơ sở tôn trọng quyền và lợi ích hợp pháp của các bên tham gia hoạt động cho thuê sản phẩm/dịch vụ thông qua hợp đồng, không trái với quy định của pháp luật.
                                </p>
                                <p>
                                    Sản phẩm/dịch vụ tham gia giao dịch trên Nền tảng đặt sân trực tuyến T&T SPORT phải đáp ứng đầy đủ các quy định của pháp luật có liên quan, không thuộc các trường hợp cấm kinh doanh, cấm quảng cáo theo quy định của pháp luật.
                                </p>
                                <p>
                                    Hoạt động cho thuê dịch vụ qua Nền tảng đặt sân trực tuyến T&T SPORT phải được thực hiện công khai, minh bạch, đảm bảo quyền lợi của người tiêu dùng.
                                </p>
                                <p>
                                    Tất cả các nội dung trong Quy định này phải tuân thủ theo hệ thống pháp luật hiện hành của Việt Nam. Thành viên khi tham gia vào Nền tảng đặt sân trực tuyến T&T SPORT phải tự tìm hiểu trách nhiệm pháp lý của mình đối với luật pháp hiện hành của Việt Nam và cam kết thực hiện đúng những nội dung trong Quy chế của Nền tảng đặt sân trực tuyến T&T SPORT.
                                </p>
                            </div>
                        </section>

                        {/* Section II */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                                II. Quy định chung
                            </h2>

                            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Định nghĩa chung:</h3>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="font-semibold text-blue-900 mb-2">Người cho thuê/Chủ sân (Nhà cung cấp, đối tác):</p>
                                    <p>Là thương nhân, tổ chức, cá nhân có nhu cầu sử dụng dịch vụ của T&T SPORT bao gồm: tạo gian hàng, giới thiệu sản phẩm/dịch vụ cho thuê sân luyện tập thể thao, giới thiệu về công ty, thực hiện các khuyến mại dịch vụ.</p>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="font-semibold text-purple-900 mb-2">Người thuê/Khách hàng:</p>
                                    <p>Là thương nhân, tổ chức, cá nhân có nhu cầu tìm hiểu thông tin về sản phẩm/dịch vụ cho thuê sân tập thể thao được đăng tải trên T&T SPORT.</p>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="font-semibold text-green-900 mb-2">Thành viên:</p>
                                    <p className="mb-2">Là bao gồm cả người cho thuê và người thuê:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Thành viên tham gia giao dịch trên nền tảng là thương nhân, tổ chức, cá nhân có nhu cầu mua bán sản phẩm/dịch vụ trên website.</li>
                                        <li>Thành viên đăng ký kê khai ban đầu các thông tin cá nhân có liên quan, được Ban quản lý nền tảng chính thức công nhận và được phép sử dụng dịch vụ do Nền tảng đặt sân trực tuyến T&T SPORT cung cấp.</li>
                                        <li>Khi bạn đăng ký là thành viên của nền tảng, thành viên có thể tạo một tài khoản cá nhân của mình để sử dụng.</li>
                                        <li>Thành viên có thể mua sản phẩm/dịch vụ theo đúng giá và quy chuẩn, đúng cam kết của thương nhân hợp pháp đã công bố trên nền tảng.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section III */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                                III. Quyền và trách nhiệm
                            </h2>

                            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Quyền của T&T SPORT:</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                                <li>T&T SPORT giữ bản quyền sử dụng dịch vụ và các nội dung trên Nền tảng đặt sân trực tuyến T&T SPORT theo các quy định pháp luật về bảo hộ sở hữu trí tuệ tại Việt Nam.</li>
                                <li>Tất cả các biểu tượng, nội dung theo các ngôn ngữ khác nhau đều thuộc quyền sở hữu của Nền tảng đặt sân trực tuyến T&T SPORT.</li>
                                <li>Nghiêm cấm mọi hành vi sao chép, sử dụng và phổ biến bất hợp pháp các quyền sở hữu trên.</li>
                                <li>T&T SPORT giữ quyền được thay đổi bảng, biểu giá dịch vụ và phương thức thanh toán trong thời gian cung cấp dịch vụ cho thành viên theo nhu cầu và điều kiện khả năng của T&T SPORT và sẽ báo trước cho thành viên thời hạn là một (01) tháng.</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. Trách nhiệm của Ban quản lý Nền tảng:</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                                <li>T&T SPORT có trách nhiệm xây dựng, thực hiện cơ chế kiểm tra, giám sát để đảm bảo việc cung cấp thông tin của người bán trên Nền tảng được thực hiện chính xác đầy đủ.</li>
                                <li>Bảo đảm Website sẽ được điều hành, hoạt động và duy trì một cách phù hợp các tiêu chuẩn chất lượng quốc gia của Việt Nam.</li>
                                <li>T&T SPORT chịu trách nhiệm xây dựng hệ thống các dịch vụ, các công cụ tiện ích phục vụ cho việc giao dịch của các thành viên tham gia và người sử dụng trên Nền tảng.</li>
                                <li>T&T SPORT có trách nhiệm đứng ra làm trung gian trong việc hòa giải nếu xảy ra tranh chấp giữa người cung cấp dịch vụ (cơ sở thể thao) và người đặt dịch vụ (người chơi).</li>
                            </ul>
                        </section>

                        {/* Section IV */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                                IV. Bảo mật thông tin
                            </h2>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p>
                                    Nền tảng đặt sân trực tuyến T&T SPORT cam kết không mua bán, trao đổi hay chia sẻ thông tin dẫn đến việc làm lộ thông tin cá nhân của Thành viên vì mục đích thương mại, vi phạm những cam kết được đặt ra trong quy định chính sách bảo mật thông tin khách hàng.
                                </p>

                                <p className="font-semibold">T&T SPORT sẽ không chia sẻ thông tin Thành viên trừ những trường hợp cụ thể sau:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Theo yêu cầu pháp lý từ một cơ quan chính phủ hoặc khi chúng tôi tin rằng việc làm đó là cần thiết và phù hợp nhằm tuân theo các yêu cầu pháp lý.</li>
                                    <li>Để bảo vệ Nền tảng đặt sân trực tuyến T&T SPORT và các bên thứ ba khác: Chúng tôi chỉ đưa ra thông tin tài khoản và những thông tin cá nhân khác khi tin chắc rằng việc đưa những thông tin đó là phù hợp với luật pháp, bảo vệ quyền lợi, tài sản của người sử dụng dịch vụ.</li>
                                    <li>Những thông tin cá nhân một cách hạn chế nhất sẽ chỉ được chia sẻ với bên thứ ba hoặc nhà tài trợ khi cần thiết.</li>
                                </ul>

                                <p>
                                    Trong những trường hợp còn lại, chúng tôi sẽ có thông báo cụ thể cho Thành viên khi phải tiết lộ thông tin cho một bên thứ ba và thông tin này chỉ được cung cấp khi được sự phản hồi đồng ý từ phía Thành viên.
                                </p>
                            </div>
                        </section>

                        {/* Section V */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                                V. Giải quyết khiếu nại và tranh chấp
                            </h2>

                            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Quy trình giải quyết khiếu nại:</h3>

                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-semibold text-gray-900 mb-2">Bước 1: Tiếp nhận khiếu nại</p>
                                    <p className="text-gray-700 mb-2">Thành viên có thể gửi khiếu nại qua các kênh sau:</p>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                        <li>Gửi thư qua đường bưu điện về địa chỉ trụ sở chính của T&T SPORT</li>
                                        <li>Gửi trực tiếp vào địa chỉ email của Website</li>
                                        <li>Gọi điện trực tiếp đến bộ phận Dịch vụ khách hàng</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-semibold text-gray-900 mb-2">Bước 2: Phân tích, đánh giá</p>
                                    <p className="text-gray-700">
                                        Trong vòng 24 giờ (không kể ngày Thứ bảy, Chủ nhật, Lễ, Tết) kể từ ngày tiếp nhận đơn khiếu nại, T&T SPORT sẽ tiến hành điều tra, xác minh, phân tích và đánh giá đơn khiếu nại của Thành viên.
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-semibold text-gray-900 mb-2">Bước 3: Tổng hợp thông tin và giải quyết</p>
                                    <p className="text-gray-700">
                                        Sau khi xác minh rõ vấn đề khiếu nại, Website sẽ tổng hợp thông tin và căn cứ theo quy định của T&T SPORT để xử lý và giải đáp khiếu nại của khách hàng.
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-semibold text-gray-900 mb-2">Bước 4: Trả lời khách hàng</p>
                                    <p className="text-gray-700">
                                        Trong vòng 24 giờ làm việc kể từ khi nhận được khiếu nại, T&T SPORT sẽ có văn bản trả lời hoặc trả lời cho Thành viên thông qua email, điện thoại. Nếu khiếu nại có tính chất phức tạp, thời gian trả lời có thể kéo dài nhưng không quá 60 giờ làm việc.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                                <p className="text-gray-700">
                                    <strong>Lưu ý:</strong> T&T SPORT tôn trọng và nghiêm túc thực hiện các quy định của pháp luật về bảo vệ quyền lợi của thành viên. Mọi hành vi lừa đảo, gian lận trong kinh doanh đều bị lên án và phải chịu hoàn toàn trách nhiệm trước pháp luật.
                                </p>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t-2 border-gray-200">
                            <p className="text-center text-gray-600">
                                Quy chế này có hiệu lực kể từ ngày công bố
                            </p>
                            <p className="text-center text-gray-800 font-semibold mt-2">
                                T&T SPORT - Nền tảng đặt sân thể thao trực tuyến
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
