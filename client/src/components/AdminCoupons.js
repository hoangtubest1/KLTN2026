import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../api';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form State
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'percent',
    value: '',
    maxUses: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons');
      setCoupons(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách mã giảm giá', error);
      alert('Không thể tải mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const openAppModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm({
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        maxUses: coupon.maxUses || '',
        startDate: format(new Date(coupon.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(coupon.endDate), 'yyyy-MM-dd'),
        isActive: coupon.isActive
      });
    } else {
      setEditingCoupon(null);
      setForm({
        code: '',
        name: '',
        type: 'percent',
        value: '',
        maxUses: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!form.code || !form.name || !form.value || !form.startDate || !form.endDate) {
        alert('Vui lòng điền đủ các trường bắt buộc');
        return;
      }
      const data = { ...form, value: Number(form.value) };

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, data);
      } else {
        await api.post('/coupons', data);
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu mã giảm giá');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      alert('Không thể xóa mã giảm giá');
    }
  };

  // Filter Logic
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) || c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || (filterType === 'active' ? c.isActive : !c.isActive);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-2 min-h-[500px]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Quản lý mã giảm giá</h2>
          <p className="text-gray-500 text-sm mt-1">Tạo và quản lý các mã khuyến mãi</p>
        </div>
        <button 
          onClick={() => openAppModal()}
          className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Thêm mã giảm giá
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-[#fcfcfd]">
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Tìm theo mã hoặc tên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] bg-white transition-shadow"
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white min-w-[120px] focus:outline-none focus:border-[#10b981]"
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Bị khóa</option>
          </select>
          <button 
            className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-transparent"
          >
            Tìm kiếm
          </button>
          <button 
            onClick={fetchCoupons}
            className="p-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors"
            title="Làm mới"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase font-semibold text-gray-500 bg-white">
              <th className="px-6 py-4">Mã</th>
              <th className="px-6 py-4">Tên</th>
              <th className="px-6 py-4">Loại</th>
              <th className="px-6 py-4 text-center">Giá trị</th>
              <th className="px-6 py-4 text-center">Đã dùng</th>
              <th className="px-6 py-4">Thời hạn</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan="8" className="text-center py-10 text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : filteredCoupons.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-12 text-gray-500">Không có mã giảm giá nào</td></tr>
            ) : (
              filteredCoupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group bg-white">
                  {/* Mã */}
                  <td className="px-6 py-4 font-bold text-[#10b981] flex items-center gap-1.5 uppercase tracking-wide">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    {c.code}
                  </td>
                  
                  {/* Tên */}
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {c.name}
                  </td>
                  
                  {/* Loại */}
                  <td className="px-6 py-4">
                    {c.type === 'percent' ? (
                       <span className="text-purple-600 font-medium inline-flex items-center gap-1">
                         <span className="font-bold text-[10px] bg-purple-100 px-1.5 py-0.5 rounded text-purple-700">%</span> Phần trăm
                       </span>
                    ) : (
                       <span className="text-blue-600 font-medium inline-flex items-center gap-1">
                         <span className="font-bold text-[10px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">$</span> Tiền mặt
                       </span>
                    )}
                  </td>
                  
                  {/* Giá trị */}
                  <td className="px-6 py-4 text-center font-bold text-gray-800">
                    {c.type === 'percent' ? `${c.value}%` : `${c.value.toLocaleString('vi-VN')}đ`}
                  </td>
                  
                  {/* Đã dùng */}
                  <td className="px-6 py-4 text-center text-gray-600 font-medium">
                    {c.currentUses}/{c.maxUses || '∞'}
                  </td>
                  
                  {/* Thời hạn */}
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">{format(new Date(c.startDate), 'dd/MM/yyyy')}</div>
                    <div className="text-gray-400 text-xs flex items-center gap-1">
                      → {format(new Date(c.endDate), 'dd/MM/yyyy')}
                    </div>
                  </td>
                  
                  {/* Trạng thái */}
                  <td className="px-6 py-4">
                    {c.isActive ? (
                      <span className="bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full text-xs">Đang hoạt động</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 font-semibold px-2.5 py-1 rounded-full text-xs">Đã khóa</span>
                    )}
                  </td>
                  
                  {/* Thao tác */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openAppModal(c)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Sửa">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Xóa">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER Paginator placeholder */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50 rounded-b-xl">
        <div>Hiển thị <span className="font-semibold text-gray-900">{filteredCoupons.length}</span> kết quả</div>
      </div>

      {/* MODAL THÊM / SỬA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{editingCoupon ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã (Code) *</label>
                  <input 
                    type="text" 
                    value={form.code} 
                    onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                    placeholder="VD: SALE50"
                    disabled={!!editingCoupon}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] disabled:bg-gray-100 uppercase" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên chương trình *</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="VD: Khuyến mãi hè"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại giảm giá</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]"
                  >
                    <option value="percent">% Phần trăm</option>
                    <option value="fixed">VND Tiền mặt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá trị *</label>
                  <input 
                    type="number" 
                    value={form.value} 
                    onChange={e => setForm({...form, value: e.target.value})}
                    placeholder={form.type === 'percent' ? "VD: 30" : "VD: 50000"}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giới hạn số lượt dùng (Bỏ trống nếu vô hạn)</label>
                <input 
                  type="number" 
                  value={form.maxUses} 
                  onChange={e => setForm({...form, maxUses: e.target.value})}
                  placeholder="VD: 100"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày bắt đầu *</label>
                  <input 
                    type="date" 
                    value={form.startDate} 
                    onChange={e => setForm({...form, startDate: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày kết thúc *</label>
                  <input 
                    type="date" 
                    value={form.endDate} 
                    onChange={e => setForm({...form, endDate: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={form.isActive} 
                  onChange={e => setForm({...form, isActive: e.target.checked})}
                  className="w-4 h-4 text-[#10b981] rounded border-gray-300 focus:ring-[#10b981] cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Cho phép sử dụng mã này (Active)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSave} 
                className="px-5 py-2.5 text-white bg-[#10b981] hover:bg-[#059669] rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                {editingCoupon ? 'Cập nhật' : 'Tạo mã mới'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCoupons;
