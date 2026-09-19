'use client';

import React, { useState, useEffect } from 'react';

// Dữ liệu danh mục và món Signature
const MENU_CATEGORIES = [
  { id: 'coffee', name: 'Cà Phê Thượng Hạng' },
  { id: 'signature', name: 'Chuồn Chuồn Signature' },
  { id: 'tea', name: 'Trà Hoa & Thảo Mộc' },
  { id: 'pastry', name: 'Bánh Thủ Công' },
];

const MENU_ITEMS = [
  {
    id: 1,
    category: 'signature',
    name: 'Cánh Chuồn Hoàng Hôn',
    desc: 'Cold brew ủ lạnh 24h kết hợp hương hoa đậu biếc, mứt cam bergamot và khói quế.',
    price: '85.000đ',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    category: 'signature',
    name: 'Sương Khói Chuồn Chuồn',
    desc: 'Espresso Arabica Cầu Đất hòa cùng bọt sữa dừa nướng béo ngậy và hạt phỉ caramel.',
    price: '79.000đ',
    badge: 'Signature',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    category: 'coffee',
    name: 'Pour Over Geisha Cầu Đất',
    desc: 'Hạt cà phê thủ công chiết xuất tinh khiết mang nốt hương hoa nhài và cam đào thanh tao.',
    price: '95.000đ',
    badge: 'Specialty',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    category: 'coffee',
    name: 'Salted Foam Robusta',
    desc: 'Robusta truyền thống pha phin nguyên bản phủ lớp kem mặn phô mai dẻo mịn.',
    price: '65.000đ',
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    category: 'tea',
    name: 'Bạch Trà Mẫu Đơn Hoa Đào',
    desc: 'Trà trắng thượng hạng đượm hương mật ong rừng và cánh hoa đào sấy lạnh.',
    price: '75.000đ',
    badge: 'Healthy',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    category: 'pastry',
    name: 'Tart Phô Mai Nướng Quả Mọng',
    desc: 'Vỏ tart bơ giòn rụm, kem phô mai mascarpone béo ngậy ăn kèm sốt dâu tây dại.',
    price: '68.000đ',
    badge: 'Handmade',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
  },
];

const FEATURES = [
  {
    title: 'Hạt Cà Phê Tuyển Chọn',
    desc: '100% hạt Arabica & Robusta thu hoạch thủ công tại đồi cao Cầu Đất, rang mộc chuẩn nhiệt.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    title: 'Không Gian Tĩnh Tại',
    desc: 'Thiết kế kết hợp mộc gỗ, giếng trời và mảng xanh thiên nhiên, mang lại sự thư thái tuyệt đối.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: 'Nghệ Thuật Pha Chế',
    desc: 'Mỗi tách đồ uống là một tác phẩm được sáng tạo bởi các Barista dày dặn đam mê và kỹ thuật.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function ChuonChuonLuxuryCoffee() {
  const [activeCategory, setActiveCategory] = useState('signature');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredItems = activeCategory === 'all' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0d0d0c] text-stone-200 font-sans selection:bg-amber-600 selection:text-white">
      {/* Thanh Header Glassmorphism */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0d0d0c]/85 backdrop-blur-xl border-b border-amber-500/10 py-4 shadow-2xl'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border border-amber-500/40 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-transparent group-hover:border-amber-400 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              {/* Biểu tượng Cánh Chuồn Chuồn */}
              <svg className="w-6 h-6 text-amber-400 transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2v20M7 8c2.5 0 5-2 5-2s2.5 2 5 2 5-2 5-2-2.5 4-5 4-5-2-5-2M7 14c2.5 0 5-1.5 5-1.5s2.5 1.5 5 1.5 4-1.5 4-1.5-2 3.5-4 3.5-5-2-5-2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-serif tracking-[0.25em] text-amber-200 uppercase font-bold">
                Chuồn Chuồn
              </span>
              <span className="text-[10px] tracking-[0.3em] text-amber-500/80 uppercase font-light">
                Artisanal Coffee & Tea
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm tracking-wider uppercase">
            <a href="#about" className="text-stone-300 hover:text-amber-400 transition-colors duration-300">Về Chúng Tôi</a>
            <a href="#menu" className="text-stone-300 hover:text-amber-400 transition-colors duration-300">Thực Đơn</a>
            <a href="#experience" className="text-stone-300 hover:text-amber-400 transition-colors duration-300">Trải Nghiệm</a>
            <a href="#contact" className="text-stone-300 hover:text-amber-400 transition-colors duration-300">Liên Hệ</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="#booking"
              className="relative px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium text-amber-300 border border-amber-500/30 overflow-hidden group hover:border-amber-400 transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-600/30 to-amber-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">Đặt Bàn Ngay</span>
            </a>
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-stone-300 hover:text-amber-400 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#141412] border-b border-amber-500/20 px-6 py-6 flex flex-col gap-4 text-center">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="py-2 text-stone-300 hover:text-amber-400">Về Chúng Tôi</a>
            <a href="#menu" onClick={() => setMobileMenuOpen(false)} className="py-2 text-stone-300 hover:text-amber-400">Thực Đơn</a>
            <a href="#experience" onClick={() => setMobileMenuOpen(false)} className="py-2 text-stone-300 hover:text-amber-400">Trải Nghiệm</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="py-2 text-stone-300 hover:text-amber-400">Liên Hệ</a>
            <a href="#booking" onClick={() => setMobileMenuOpen(false)} className="mt-2 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold rounded-full text-xs uppercase tracking-widest">
              Đặt Bàn Ngay
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-[400px] h-[400px] bg-orange-700/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 backdrop-blur-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs uppercase tracking-[0.2em] text-amber-300 font-medium">
              Không gian trải nghiệm cà phê thủ công
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-stone-100 font-extralight tracking-tight leading-[1.15] mb-6">
            Nơi Cánh Chuồn Nghỉ Lại, <br />
            <span className="font-normal italic bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              Hương Cà Phê Ngưng Đọng
            </span>
          </h1>

          <p className="text-stone-400 max-w-2xl text-base sm:text-lg leading-relaxed font-light mb-10">
            Được chế tác từ những hạt mộc Cầu Đất tinh túy nhất trong không gian ngập tràn ánh sáng và thanh âm thiên nhiên. Khám phá khoảnh khắc thưởng trà và cà phê an yên trọn vẹn.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <a
              href="#menu"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all duration-300 transform hover:-translate-y-1"
            >
              Khám Phá Menu
            </a>
            <a
              href="#about"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-stone-700 hover:border-amber-400/60 bg-stone-900/40 backdrop-blur-sm text-stone-300 hover:text-amber-200 text-xs uppercase tracking-[0.2em] transition-all duration-300"
            >
              Câu Chuyện Của Chúng Tôi
            </a>
          </div>

          {/* Quick specs banner */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 border-t border-stone-800/80 pt-10 w-full">
            <div>
              <div className="text-3xl font-serif text-amber-300 font-normal">100%</div>
              <div className="text-xs text-stone-400 tracking-wider uppercase mt-1">Hạt Mộc Nguyên Chất</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-amber-300 font-normal">24h</div>
              <div className="text-xs text-stone-400 tracking-wider uppercase mt-1">Ủ Lạnh Cold Brew Tinh Túy</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-amber-300 font-normal">1,500m</div>
              <div className="text-xs text-stone-400 tracking-wider uppercase mt-1">Độ Cao Thu Hoạch Cầu Đất</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-amber-300 font-normal">08:00 - 22:30</div>
              <div className="text-xs text-stone-400 tracking-wider uppercase mt-1">Đón Bạn Mỗi Ngày</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="about" className="py-24 bg-[#121210] border-y border-stone-800/60 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-3 font-medium">Giá Trị Cốt Lõi</h2>
            <p className="text-3xl sm:text-4xl font-serif text-stone-100 font-light">Mỗi Tách Cà Phê Là Một Tác Phẩm</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feat, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-[#181816]/70 border border-stone-800/80 hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-2 shadow-lg"
              >
                <div className="w-14 h-14 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-serif text-stone-200 mb-3 group-hover:text-amber-300 transition-colors duration-300">
                  {feat.title}
                </h3>
                <p className="text-stone-400 text-sm leading-relaxed font-light">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Menu Section */}
      <section id="menu" className="py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-3 font-medium">Thực Đơn Đặc Sắc</h2>
            <p className="text-3xl sm:text-5xl font-serif text-stone-100 font-light tracking-tight">Hương Vị Được Yêu Thích</p>
          </div>

          {/* Danh mục Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-105'
                    : 'bg-stone-900/80 text-stone-400 border border-stone-800 hover:border-amber-500/40 hover:text-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid Menu Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden bg-[#151513] border border-stone-800/80 hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between shadow-xl"
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151513] via-transparent to-black/30" />
                  <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/90 text-stone-950 shadow-md">
                    {item.badge}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xl font-serif text-stone-100 group-hover:text-amber-300 transition-colors duration-300 mb-2">
                      {item.name}
                    </h4>
                    <p className="text-stone-400 text-xs sm:text-sm leading-relaxed font-light mb-6">
                      {item.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-stone-800/60">
                    <span className="text-lg font-serif text-amber-400 font-medium">{item.price}</span>
                    <button className="text-xs uppercase tracking-wider text-stone-300 hover:text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-all">
                      Thưởng thức
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA Section */}
      <section id="booking" className="py-20 relative bg-gradient-to-b from-[#121210] to-[#0a0a09]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-10 sm:p-14 rounded-3xl border border-amber-500/20 bg-gradient-to-b from-stone-900/60 to-stone-950/90 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-100 mb-4 font-light">
              Đặt Chỗ Trước Cùng Chuồn Chuồn
            </h2>
            <p className="text-stone-400 text-sm max-w-md mx-auto mb-8 font-light">
              Hãy để chúng tôi chuẩn bị chỗ ngồi êm ả nhất và hương vị cà phê tươi mới nhất dành riêng cho bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Số điện thoại hoặc Email..."
                className="flex-1 px-5 py-3.5 rounded-full bg-stone-900 border border-stone-700 text-sm focus:outline-none focus:border-amber-400 text-stone-200 placeholder-stone-500"
              />
              <button className="px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg">
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-stone-800/80 py-12 bg-[#0a0a09] text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-serif tracking-widest text-stone-300 uppercase font-semibold text-sm">
              Chuồn Chuồn Coffee
            </span>
            <span>|</span>
            <span>Không gian cà phê thủ công & an yên</span>
          </div>
          <div>
            Đà Lạt & TP. Hồ Chí Minh • Hotline: 090 123 4567
          </div>
          <div className="text-stone-600">
            © 2026 Chuồn Chuồn Artisanal Coffee. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}