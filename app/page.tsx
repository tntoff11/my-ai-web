'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode, SVGProps } from 'react';

/* COZE INTEGRATION — deliberately disabled until configured.
 * Paste the exact CDN URL from Coze → Publish → Web SDK → Installation.
 * Match createCozeOptions to that SDK version's installation snippet.
 * This is a client-side demo: anything placed here is public in the JS bundle.
 * Never put a production secret here. Production authentication should use a
 * server-issued, short-lived credential supported by the selected SDK version.
 * Reference: https://www.coze.com/open/docs/developer_guides/web_sdk
 */
const COZE_CONFIG: { enabled: boolean; sdkUrl: string; botId: string; token: string } = {
  enabled: true,
  sdkUrl: 'https://sf-cdn.coze.com/obj/unpkg-va/flow-platform/chat-app-sdk/1.2.0-beta.6/libs/oversea/index.js',
  botId: '7685978136609603637',
  token: 'pat_gqNrVjGcMDMpXLpQJ32R75llohXbgDDZXMDDwGbvExvb4PXAJMxx91FysHC6wFu0',
};

type CozeChatClientInstance = {
  showChatBot?: () => void;
  hideChatBot?: () => void;
  destroy?: () => void;
};
type CozeWebSDKGlobal = {
  WebChatClient: new (options: Record<string, unknown>) => CozeChatClientInstance;
};
declare global {
  interface Window {
    CozeWebSDK?: CozeWebSDKGlobal;
  }
}

const COZE_USER_ID_STORAGE_KEY = 'chuon-chuon-coze-user-id';

function getOrCreateCozeUserId(): string {
  if (typeof window === 'undefined') return 'chuon-chuon-web-user';

  const existing = window.localStorage.getItem(COZE_USER_ID_STORAGE_KEY);
  if (existing) return existing;

  const generated =
    typeof window.crypto?.randomUUID === 'function'
      ? `chuon-chuon-${window.crypto.randomUUID()}`
      : `chuon-chuon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(COZE_USER_ID_STORAGE_KEY, generated);
  return generated;
}

function createCozeOptions(): Record<string, unknown> {
  // Isolated adapter matching Coze Web SDK 1.2.0-beta.6 installation syntax.
  return {
    config: {
      type: 'bot',
      bot_id: COZE_CONFIG.botId,
      isIframe: false,
    },
    auth: {
      type: 'token',
      token: COZE_CONFIG.token,
      onRefreshToken: async () => COZE_CONFIG.token,
    },
    userInfo: {
      id: getOrCreateCozeUserId(),
      url: 'https://sf-coze-web-cdn.coze.com/obj/eden-sg/lm-lgvj/ljhwZthlaukjlkulzlp/coze/coze-logo.png',
      nickname: 'User',
    },
    ui: {
      base: {
        icon: 'https://sf-coze-web-cdn.coze.com/obj/eden-sg/lm-lgvj/ljhwZthlaukjlkulzlp/coze/chatsdk-logo.png',
        layout: 'pc',
        lang: 'en',
        zIndex: 1000,
      },
      header: {
        isShow: true,
        isNeedClose: true,
      },
      asstBtn: {
        isNeed: false,
      },
      footer: {
        isShow: false,
      },
      chatBot: {
        title: 'Điểm Du Lịch Chuồn Chuồn',
        uploadable: true,
        width: 390,
      },
    },
  };
}

type ChatState = 'disabled' | 'loading' | 'ready' | 'unavailable';
function useCoze() {
  const clientRef = useRef<CozeChatClientInstance | null>(null);
  const [state, setState] = useState<ChatState>('disabled');

  useEffect(() => {
    if (typeof window === 'undefined' || !COZE_CONFIG.enabled) return;
    if (!COZE_CONFIG.sdkUrl || !COZE_CONFIG.botId || !COZE_CONFIG.token) {
      setState('unavailable');
      return;
    }
    let absoluteUrl: string;
    try {
      const url = new URL(COZE_CONFIG.sdkUrl);
      if (url.protocol !== 'https:') { setState('unavailable'); return; }
      absoluteUrl = url.href;
    } catch { setState('unavailable'); return; }

    let disposed = false;
    let initialized = false;
    let owned = false;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    setState('loading');
    let script = Array.from(document.scripts).find((node) => node.src === absoluteUrl);

    const onLoad = () => {
      if (disposed || initialized) return;
      if (loadTimer) clearTimeout(loadTimer);
      if (script) script.dataset.chuonCozeLoaded = 'true';
      const Client = window.CozeWebSDK?.WebChatClient;
      if (!Client) { setState('unavailable'); return; }
      try {
        clientRef.current = new Client(createCozeOptions());
        initialized = true;
        setState(typeof clientRef.current.showChatBot === 'function' ? 'ready' : 'unavailable');
      } catch { setState('unavailable'); }
    };
    const onError = () => {
      if (loadTimer) clearTimeout(loadTimer);
      if (!disposed) setState('unavailable');
    };

    if (!script) {
      script = document.createElement('script');
      script.src = absoluteUrl;
      script.async = true;
      script.dataset.chuonCoze = 'true';
      script.onload = onLoad;
      script.onerror = onError;
      owned = true;
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
      // An already-loaded script has already completed its load event.
      if (script.dataset.chuonCozeLoaded === 'true' || window.CozeWebSDK?.WebChatClient) {
        queueMicrotask(onLoad);
      }
    }
    loadTimer = setTimeout(onError, 15000);
    return () => {
      disposed = true;
      if (loadTimer) clearTimeout(loadTimer);
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
      if (owned && script) { script.onload = null; script.onerror = null; script.remove(); }
      const client = clientRef.current;
      clientRef.current = null;
      try {
        if (client?.destroy) client.destroy();
        else client?.hideChatBot?.();
      } catch { /* Optional third-party cleanup must not interrupt navigation. */ }
    };
  }, []);

  const open = (): boolean => {
    if (state !== 'ready' || !clientRef.current?.showChatBot) return false;
    try { clientRef.current.showChatBot(); return true; }
    catch { setState('unavailable'); return false; }
  };
  return { state, open };
}

type SymbolName = 'arrow' | 'down' | 'menu' | 'close' | 'pin' | 'clock' | 'phone' | 'chat' | 'chevron' | 'sun' | 'ticket' | 'leaf' | 'spark' | 'mail';
function SymbolIcon({ name, size = 20, className = '' }: { name: SymbolName; size?: number; className?: string }) {
  const paths: Record<SymbolName, ReactNode> = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7" /></>,
    down: <><path d="M12 4v16m-7-7 7 7 7-7" /></>,
    menu: <><path d="M3 7h18M3 12h18M3 17h18" /></>,
    close: <><path d="M5 5l14 14M19 5 5 19" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
    phone: <><path d="m8 3 3 5-3 3c1 2 3 4 5 5l3-3 5 3c0 3-2 5-4 5C10 21 3 14 3 7c0-2 2-4 5-4Z" /></>,
    chat: <><path d="M20 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 0 1-1-4 8 8 0 0 1 9-8" /><path d="M12 12c-1-6 4-8 9-8 0 5-2 9-7 8m-3 3 7-8" /></>,
    chevron: <><path d="m9 5 7 7-7 7" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>,
    ticket: <><path d="M3 8V5h18v3a4 4 0 0 0 0 8v3H3v-3a4 4 0 0 0 0-8Z" /><path d="M13 6v2m0 3v2m0 3v2" /></>,
    leaf: <><path d="M20 4C10 4 4 9 4 16a4 4 0 0 0 4 4c7 0 12-6 12-16ZM5 19c3-5 6-8 11-10" /></>,
    spark: <><path d="m12 2 1.7 7.3L21 11l-7.3 1.7L12 20l-1.7-7.3L3 11l7.3-1.7L12 2Zm7 15 .5 1.5L21 19l-1.5.5L19 21l-.5-1.5L17 19l1.5-.5L19 17Z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  };
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const ROOT = '/images/chuon-chuon/';
const PHOTO = {
  hero: ROOT + 'cau-vuon-hoa-tren-cao.jpg',
  flowers: ROOT + 'toan-canh-vuon-hoa.jpg',
  family: ROOT + 'gia-dinh-vuon-hoa.jpg',
  bridge: ROOT + 'cau-check-in.jpg',
  animal: ROOT + 'gia-dinh-vuon-thu.jpg',
  lamb: ROOT + 'cuu-va-du-khach.jpg',
  child: ROOT + 'em-be-vuon-thu.jpg',
  lake: ROOT + 'dap-xe-tren-nuoc.jpg',
  cafe: ROOT + 'khong-gian-am-thuc.jpg',
  path: ROOT + 'loi-di-giua-vuon-hoa.jpg',
  mini: ROOT + 'tieu-canh-nha-tren-cay.jpg',
  sign: ROOT + 'cau-chuon-chuon-thumbnail.jpg',
  campaign1: ROOT + 'anh-chien-dich-khu-vui-choi.jpg',
  campaign2: ROOT + 'anh-chien-dich-check-in.jpg',
} as const;
const MAP = 'https://maps.app.goo.gl/wrVAJHmaF4rPXgvEA';
const PHONE = 'tel:+84702882299';
const EMAIL = 'mailto:kinhdoanh.chuonchuon@gmail.com';
const NAV = [
  { href: '#trai-nghiem', label: 'Trải nghiệm' },
  { href: '#gia-ve', label: 'Giá vé' },
  { href: '#len-ke-hoach', label: 'Lên kế hoạch' },
  { href: '#duong-di', label: 'Đường đi' },
  { href: '#khach-doan', label: 'Khách đoàn' },
];

function Wordmark({ light = false }: { light?: boolean }) {
  return <a href="#dau-trang" className={`wordmark ${light ? 'wordmark-light' : ''}`} aria-label="Điểm Du Lịch Chuồn Chuồn - Về đầu trang">
    <span className="wordmark-emblem" aria-hidden="true"><span className="emblem-body" /><span className="wing wing-a" /><span className="wing wing-b" /><span className="wing wing-c" /><span className="wing wing-d" /></span>
    <span className="wordmark-text"><strong>CHUỒN CHUỒN</strong><small>ĐIỂM DU LỊCH · LÂM ĐỒNG</small></span>
  </a>;
}

function usePageMotion() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
    if (!reduce) { root.classList.add('motion-ready'); reveals.forEach(el => io.observe(el)); }
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty('--page-progress', String(p));
      root.style.setProperty('--hero-scroll', `${Math.min(220, Math.max(0, window.scrollY * 0.23))}px`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { io.disconnect(); if (frame) cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
  return rootRef;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 50);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [open]);
  return <header className={`site-header ${scrolled || open ? 'header-solid' : ''}`}>
    <div className="header-inner"><Wordmark /><nav className="desktop-nav" aria-label="Điều hướng chính">{NAV.map(item => <a href={item.href} key={item.href}>{item.label}</a>)}</nav>
      <a className="nav-map" href={MAP} target="_blank" rel="noopener noreferrer"><SymbolIcon name="pin" size={17} /> Chỉ đường <SymbolIcon name="arrow" size={16} /></a>
      <button className="mobile-toggle" type="button" aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(v => !v)}><SymbolIcon name={open ? 'close' : 'menu'} size={25} /></button>
    </div>
    {open && <nav className="mobile-nav" id="mobile-navigation" aria-label="Điều hướng di động">{NAV.map((item, index) => <a href={item.href} key={item.href} onClick={() => setOpen(false)}><span>0{index + 1}</span>{item.label}<SymbolIcon name="arrow" size={19} /></a>)}<a href={MAP} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Mở Google Maps <SymbolIcon name="arrow" size={19} /></a></nav>}
  </header>;
}

function SlideTrack({ small = false }: { small?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const riderRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const track = trackRef.current, path = pathRef.current, rider = riderRef.current;
      if (!track || !path || !rider) return;
      const rect = track.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight * .78 - rect.top) / (window.innerHeight * .78 + rect.height)));
      const point = path.getPointAtLength(path.getTotalLength() * progress);
      rider.style.left = `${Math.min(100, Math.max(0, point.x / 1024 * 100))}%`;
      rider.style.top = `${point.y / 180 * 100}%`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
  return <div ref={trackRef} className={`slide-track ${small ? 'slide-track-small' : ''}`} aria-hidden="true"><svg viewBox="0 0 1024 180" preserveAspectRatio="none"><path ref={pathRef} className="track-shadow" d="M-20 95 C155 -5 207 195 396 90 S641 -12 758 73 S944 174 1044 52" /><path className="track-main" d="M-20 95 C155 -5 207 195 396 90 S641 -12 758 73 S944 174 1044 52" /></svg><span ref={riderRef} className="track-rider">✦</span></div>;
}

function Hero() {
  return <section className="hero" id="dau-trang" aria-labelledby="hero-title">
    <div className="hero-photo"><img src={PHOTO.hero} alt="Lối đi uốn lượn giữa những dải hoa tím tại Chuồn Chuồn" fetchPriority="high" /></div><div className="hero-wash" />
    <div className="hero-content"><div className="hero-kicker"><span className="pulse-dot" /> MỘT NGÀY THẬT KHÁC · NAM BAN, LÂM ĐỒNG</div>
      <h1 id="hero-title">Đi theo<br /><em>lối vui.</em></h1>
      <p>Giữa đồi xanh và những con đường ngập hoa, mỗi khúc quanh lại mở ra một trải nghiệm mới.</p>
      <div className="hero-actions"><a className="button button-light" href="#trai-nghiem">Bắt đầu khám phá <SymbolIcon name="arrow" size={19} /></a><a className="hero-link" href="#gia-ve">Xem giá vé <span>↗</span></a></div>
    </div>
    <div className="hero-index" aria-hidden="true">01 <span>/</span> CHUỒN CHUỒN</div>
    <a href="#gioi-thieu" className="hero-scroll" aria-label="Cuộn xuống tìm hiểu"><span>CUỘN ĐỂ KHÁM PHÁ</span><SymbolIcon name="down" size={17} /></a>
    <div className="hero-bottom"><div><SymbolIcon name="clock" size={18} /> 07:30 — 17:00 · HẰNG NGÀY</div><div><SymbolIcon name="pin" size={18} /> NAM BAN, LÂM ĐỒNG</div><span>KHÁM PHÁ THEO CÁCH CỦA BẠN</span></div>
  </section>;
}

function Intro() {
  return <section className="intro section-shell" id="gioi-thieu"><div className="intro-topline"><span>01 / LỜI CHÀO TỪ CHUỒN CHUỒN</span><span>ĐIỂM DU LỊCH · THIÊN NHIÊN · TRẢI NGHIỆM</span></div>
    <div className="intro-grid"><div className="intro-side" data-reveal><span className="big-sun" aria-hidden="true">✳</span><span>MỘT KHOẢNG TRỜI CHO MỌI NGƯỜI</span></div>
      <div data-reveal><h2>Chuyến đi đẹp nhất<br />là chuyến đi <em>có điều để nhớ.</em></h2><p>Điểm Du Lịch Chuồn Chuồn là nơi tham quan, vui chơi và check-in giữa thiên nhiên Lâm Đồng. Từ vườn hoa, khu thú mini đến những trò chơi ngoài trời, mỗi người đều có thể chọn cho mình một nhịp khám phá riêng.</p><a href="#trai-nghiem" className="text-link">Theo dấu những trải nghiệm <SymbolIcon name="arrow" size={20} /></a></div></div>
    <div className="intro-photo-grid"><figure className="intro-picture intro-picture-a" data-reveal><img src={PHOTO.family} alt="Gia đình dạo trên lối gỗ giữa khu vườn hoa" loading="lazy" /><figcaption>01 — Cùng nhau đi dạo</figcaption></figure><figure className="intro-picture intro-picture-b" data-reveal><img src={PHOTO.path} alt="Lối đi uốn lượn giữa những khóm hoa tím" loading="lazy" /><figcaption>02 — Rẽ vào một mùa hoa</figcaption></figure><figure className="intro-picture intro-picture-c" data-reveal><img src={PHOTO.mini} alt="Tiểu cảnh những ngôi nhà nhỏ trong khu vườn" loading="lazy" /><figcaption>03 — Gặp điều bất ngờ</figcaption></figure></div>
  </section>;
}

const EXPERIENCES = [
  { no: '01', title: 'Lạc giữa vườn hoa', type: 'CẢNH QUAN & CHECK-IN', image: PHOTO.flowers, alt: 'Toàn cảnh vườn hoa tím trên sườn đồi', desc: 'Đi chậm qua những lối hoa, tìm góc ảnh của riêng bạn. Cảnh quan hoa thay đổi theo mùa và điều kiện thực tế.' },
  { no: '02', title: 'Ghé thăm vườn thú mini', type: 'GIA ĐÌNH & KHÁM PHÁ', image: PHOTO.animal, alt: 'Gia đình tương tác với những chú cừu tại vườn thú mini', desc: 'Một điểm dừng thân thiện cho cả nhà. Thức ăn chuyên dụng để cho thú ăn được thanh toán riêng.' },
  { no: '03', title: 'Đạp xe trên nước', type: 'VẬN ĐỘNG & THƯ GIÃN', image: PHOTO.lake, alt: 'Du khách đạp xe trên mặt hồ giữa cây xanh', desc: 'Đổi góc nhìn về khu vườn từ mặt hồ. Hoạt động có thể tạm dừng khi thời tiết không an toàn.' },
  { no: '04', title: 'Chạm vào tầng mây', type: 'THÁP VỌNG CẢNH & CẦU KÍNH', image: PHOTO.bridge, alt: 'Cầu và công trình tham quan trên cao tại Chuồn Chuồn', desc: 'Ngắm đồi xanh từ trên cao và ghi lại những khung hình thật khác ở các điểm check-in.' },
  { no: '05', title: 'Dừng chân, nhìn xa', type: 'ẨM THỰC & NGHỈ NGƠI', image: PHOTO.cafe, alt: 'Không gian bàn ghế ngoài trời nhìn ra cảnh quan', desc: 'Một nhà hàng chính và các điểm phục vụ đồ uống để nghỉ chân giữa hành trình. Ăn uống thanh toán riêng.' },
];
function Experiences() {
  const railRef = useRef<HTMLDivElement>(null);
  const step = (direction: number) => railRef.current?.scrollBy({ left: direction * Math.min(480, railRef.current.clientWidth * .85), behavior: 'smooth' });
  return <section className="experiences" id="trai-nghiem" aria-labelledby="experience-title"><div className="section-shell experiences-inner"><div className="section-heading" data-reveal><span className="eyebrow">02 / HÀNH TRÌNH TRẢI NGHIỆM</span><div className="heading-row"><h2 id="experience-title">Có một <em>lối vui</em><br />dành cho bạn.</h2><p>Trượt qua những mảnh ghép của Chuồn Chuồn. Mỗi điểm dừng là một lý do để ở lại thêm một chút.</p></div></div>
    <SlideTrack /><div className="rail-head"><span>KÉO NGANG ĐỂ KHÁM PHÁ <SymbolIcon name="arrow" size={17} /></span><div className="rail-buttons"><button type="button" aria-label="Xem trải nghiệm trước" onClick={() => step(-1)}><SymbolIcon name="arrow" size={20} className="flip" /></button><button type="button" aria-label="Xem trải nghiệm tiếp theo" onClick={() => step(1)}><SymbolIcon name="arrow" size={20} /></button></div></div></div>
    <div className="experience-rail" ref={railRef} tabIndex={0} aria-label="Danh sách trải nghiệm, cuộn ngang để xem thêm">{EXPERIENCES.map((item) => <article className="experience-card" key={item.no}><div className="experience-image"><img src={item.image} alt={item.alt} loading="lazy" /><span className="card-index">{item.no} / 05</span></div><div className="experience-info"><span>{item.type}</span><h3>{item.title}</h3><p>{item.desc}</p></div></article>)}</div>
    <div className="section-shell experience-note">Vé tham quan còn bao gồm Sky Line, trượt phao khô 7 sắc cầu vồng và xích đu ngắm cảnh. <a href="#luu-y">Xem lưu ý tham gia <SymbolIcon name="arrow" size={16} /></a></div>
  </section>;
}

function Momentum() {
  return <section className="momentum" aria-label="Khoảnh khắc tại Chuồn Chuồn"><div className="momentum-image"><img src={PHOTO.bridge} alt="Cầu tham quan với tầm nhìn ra đồi xanh tại Chuồn Chuồn" loading="lazy" /></div><div className="momentum-overlay" /><div className="momentum-content" data-reveal><span className="eyebrow">GIỮ LẠI MỘT KHOẢNH KHẮC</span><p>Đổi một lối rẽ.<br /><em>Mở cả một chân trời.</em></p><a href="#bo-suu-tap" className="button button-outline-light">Xem những góc hình <SymbolIcon name="arrow" size={19} /></a></div><span className="momentum-corner">CHUỒN CHUỒN / LÂM ĐỒNG</span></section>;
}

function Tickets() {
  return <section className="tickets section-shell" id="gia-ve" aria-labelledby="ticket-title"><div className="ticket-intro" data-reveal><span className="eyebrow">03 / THÔNG TIN VÉ</span><h2 id="ticket-title">Một tấm vé.<br /><em>Rất nhiều niềm vui.</em></h2><p>Chọn loại vé theo chiều cao thực tế. Giá đã bao gồm VAT và áp dụng như nhau vào ngày thường, cuối tuần và dịp lễ.</p><div className="ticket-stamp"><SymbolIcon name="ticket" size={22} /> MUA VÉ TRỰC TIẾP TẠI ĐIỂM</div></div>
    <div className="ticket-stack" data-reveal><article className="ticket-card ticket-adult"><div className="ticket-card-top"><span>VÉ THAM QUAN</span><span>01 / NGƯỜI LỚN</span></div><div className="ticket-price"><strong>120.000</strong><span>đ / khách</span></div><p>Khách cao trên 1m4</p><span className="ticket-pattern" aria-hidden="true">✳</span></article>
      <article className="ticket-card ticket-child"><div className="ticket-card-top"><span>VÉ THAM QUAN</span><span>02 / TRẺ EM</span></div><div className="ticket-price"><strong>80.000</strong><span>đ / khách</span></div><p>Từ 1m đến 1m4 · dưới 1m miễn phí</p><span className="ticket-pattern" aria-hidden="true">✳</span></article></div>
    <div className="ticket-details"><div><span className="detail-circle"><SymbolIcon name="spark" size={22} /></span><div><h3>Đã gồm trong vé</h3><p>Tham quan, check-in vườn hoa, vườn thú mini, đạp xe trên nước, xích đu ngắm cảnh, Sky Line và trượt phao khô.</p></div></div><div><span className="detail-circle"><SymbolIcon name="sun" size={22} /></span><div><h3>Chi phí riêng</h3><p>Đồ ăn, thức uống tại các điểm ẩm thực và thức ăn chuyên dụng cho thú được thanh toán riêng.</p></div></div></div>
  </section>;
}

const GALLERY = [
  { image: PHOTO.lamb, alt: 'Du khách cho đàn cừu ăn', note: 'Gặp gỡ những người bạn nhỏ', cls: 'g1' },
  { image: PHOTO.child, alt: 'Em bé vui chơi gần những chú cừu', note: 'Chuyến đi của cả gia đình', cls: 'g2' },
  { image: PHOTO.sign, alt: 'Cầu cong với biển Chuồn Chuồn Đà Lạt', note: 'Một góc Chuồn Chuồn', cls: 'g3' },
  { image: PHOTO.campaign1, alt: 'Ảnh thiết kế khu vui chơi Chuồn Chuồn', note: 'Khoảnh khắc vui chơi', cls: 'g4' },
  { image: PHOTO.campaign2, alt: 'Ảnh thiết kế nhóm du khách check-in tại Chuồn Chuồn', note: 'Đi cùng nhau, vui cùng nhau', cls: 'g5' },
];
function Gallery() {
  return <section className="gallery" id="bo-suu-tap" aria-labelledby="gallery-title"><div className="section-shell gallery-heading" data-reveal><div><span className="eyebrow">04 / ALBUM CHUỒN CHUỒN</span><h2 id="gallery-title">Một nơi.<br /><em>Muôn góc nhìn.</em></h2></div><p>Những hình ảnh thật trong bộ tư liệu Chuồn Chuồn. Cảnh quan và tình trạng hoa có thể thay đổi theo mùa.</p></div><div className="gallery-grid section-shell">{GALLERY.map(item => <figure className={`gallery-frame ${item.cls}`} key={item.cls} data-reveal><img src={item.image} alt={item.alt} loading="lazy" /><figcaption>{item.note}</figcaption></figure>)}</div></section>;
}

function Plan() {
  const [faq, setFaq] = useState<number | null>(null);
  const questions = [
    { q: 'Trời mưa, các hoạt động có mở không?', a: 'Khu tham quan vẫn có nhà hàng và điểm có mái che. Sky Line, trượt phao khô và đạp xe trên nước có thể tạm dừng khi thời tiết không an toàn. Vui lòng gọi hotline để hỏi tình trạng trong ngày.' },
    { q: 'Tôi có cần đặt vé trước không?', a: 'Vé được mua trực tiếp tại điểm tham quan; khách lẻ không cần đặt trước. Với khách đoàn, vui lòng liên hệ trước để được chuẩn bị và tư vấn.' },
    { q: 'Có thể mang xe đẩy hoặc dùng xe lăn không?', a: 'Có thể mang xe đẩy trẻ em, nhưng địa hình đồi có nhiều đoạn dốc. Phần lớn khu tham quan có thể khó tiếp cận đối với người dùng xe lăn; khu nhà hàng thuận tiện hơn.' },
    { q: 'Có được đổi ngày hoặc hoàn vé vì mưa không?', a: 'Theo thông tin doanh nghiệp cung cấp, vé đã mua không áp dụng đổi ngày hoặc hoàn tiền do mưa hay thời tiết xấu.' },
  ];
  return <section className="plan" id="len-ke-hoach" aria-labelledby="plan-title"><div className="section-shell"><div className="plan-heading" data-reveal><span className="eyebrow">05 / TRƯỚC KHI LÊN ĐƯỜNG</span><h2 id="plan-title">Chuẩn bị một chút.<br /><em>Vui trọn cả ngày.</em></h2></div><div className="plan-grid"><div className="plan-lead" data-reveal><img src={PHOTO.path} alt="Lối đi qua hoa tím trên địa hình đồi của Chuồn Chuồn" loading="lazy" /><div><span>HÀNH TRÌNH TRONG KHUÔN VIÊN</span><p>Địa hình đồi có các đoạn dốc. Hãy chọn nhịp di chuyển phù hợp cho người lớn tuổi, gia đình có trẻ nhỏ và người khó di chuyển.</p></div></div><div className="plan-facts" id="luu-y" data-reveal><div className="fact"><span>01 / GIỜ MỞ CỬA</span><strong>07:30 — 17:00</strong><p>Mở cửa hằng ngày, kể cả cuối tuần và ngày lễ. Các khu cùng theo khung giờ chung.</p></div><div className="fact"><span>02 / TRÒ CHƠI CẢM GIÁC MẠNH</span><strong>Trên 1m2</strong><p>Trẻ em cao trên 1m2 có thể tham gia Sky Line và trượt phao khô khi đủ sức khỏe; làm theo hướng dẫn của nhân viên.</p></div><div className="fact"><span>03 / NGHỈ CHÂN & ĂN UỐNG</span><strong>Nhà hàng & quầy nước</strong><p>Có một nhà hàng chính và ba điểm phục vụ đồ uống. Đồ ăn, thức uống được tính riêng ngoài vé.</p></div><div className="fact"><span>04 / TÌNH TRẠNG TRONG NGÀY</span><strong>Hỏi nhân viên</strong><p>Hoa và hoạt động ngoài trời có thể thay đổi. Liên hệ trước nếu bạn cần biết tình trạng thực tế.</p></div></div></div>
      <div className="faq" aria-labelledby="faq-title"><div className="faq-intro"><span className="eyebrow">CÂU HỎI THƯỜNG GẶP</span><h3 id="faq-title">Bạn còn<br /><em>thắc mắc?</em></h3></div><div className="faq-list">{questions.map((item, index) => <div className="faq-item" key={item.q}><button type="button" aria-expanded={faq === index} aria-controls={`faq-answer-${index}`} onClick={() => setFaq(faq === index ? null : index)}><span>0{index + 1}</span>{item.q}<b aria-hidden="true">{faq === index ? '−' : '+'}</b></button><div id={`faq-answer-${index}`} className={`faq-answer ${faq === index ? 'faq-open' : ''}`} hidden={faq !== index}><p>{item.a}</p></div></div>)}</div></div>
    </div></section>;
}

function Visit() {
  return <section className="visit" id="duong-di" aria-labelledby="visit-title"><div className="visit-image"><img src={PHOTO.hero} alt="Toàn cảnh lối đi và vườn hoa tại điểm du lịch" loading="lazy" /></div><div className="visit-panel" data-reveal><span className="eyebrow">06 / HẸN GẶP Ở CHUỒN CHUỒN</span><h2 id="visit-title">Lối vui<br /><em>bắt đầu ở đây.</em></h2><div className="visit-address"><SymbolIcon name="pin" size={25} /><div><span>ĐỊA CHỈ</span><p>217 Thôn 5, Nam Ban,<br />Lâm Đồng, Việt Nam</p></div></div><div className="visit-micro"><div><strong>18–20 km</strong><span>Từ trung tâm Đà Lạt</span></div><div><strong>Miễn phí</strong><span>Bãi đỗ xe máy, ô tô, xe đoàn</span></div></div><p className="visit-time">Thời gian từ trung tâm Đà Lạt thường khoảng 30–40 phút, tùy điểm xuất phát và giao thông.</p><a href={MAP} target="_blank" rel="noopener noreferrer" className="button button-dark">Mở Google Maps <SymbolIcon name="arrow" size={19} /></a></div></section>;
}

function Groups() {
  return <section className="groups section-shell" id="khach-doan"><div className="groups-flower" aria-hidden="true">✳</div><span className="eyebrow">ĐI CÙNG NHAU, VUI HƠN NỮA</span><h2>Hẹn cả nhóm<br /><em>cùng khám phá.</em></h2><p>Chuồn Chuồn đón tiếp đoàn, trường học và doanh nghiệp. Liên hệ trước để được tư vấn hoạt động, ăn uống và cách chuẩn bị phù hợp cho đoàn của bạn.</p><div className="group-actions"><a className="button button-dark" href={EMAIL}>Gửi yêu cầu tư vấn <SymbolIcon name="arrow" size={18} /></a><a className="group-phone" href={PHONE}><SymbolIcon name="phone" size={18} /> 070 288 2299</a></div><div className="group-small">Hotline có nhân viên tiếp nhận: 08:00 — 17:30</div></section>;
}

function Footer() {
  return <footer className="footer"><div className="footer-top section-shell"><div><Wordmark light /><p>Một chuyến đi qua đồi xanh,<br />và những điều vui ở mỗi khúc quanh.</p></div><div><strong>KHÁM PHÁ</strong>{NAV.map(item => <a href={item.href} key={item.href}>{item.label}</a>)}</div><div><strong>LIÊN HỆ</strong><a href={PHONE}>070 288 2299</a><a href={EMAIL}>kinhdoanh.chuonchuon@gmail.com</a><a href={MAP} target="_blank" rel="noopener noreferrer">217 Thôn 5, Nam Ban, Lâm Đồng ↗</a></div><div className="footer-sun" aria-hidden="true">✳</div></div><div className="footer-bottom section-shell"><span>© 2026 ĐIỂM DU LỊCH CHUỒN CHUỒN</span><span>GIỮ NHỊP VUI TRONG TỪNG CHUYẾN ĐI</span><a href="#dau-trang">LÊN ĐẦU TRANG ↑</a></div></footer>;
}

function GardenChat() {
  const { state, open } = useCoze();
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!visible) return;
    closeRef.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setVisible(false); buttonRef.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setVisible(false); };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside); };
  }, [visible]);
  return <div ref={containerRef} className="chat-widget">
    {visible && <section id="garden-chat-panel" aria-labelledby="chat-title" className="chat-panel"><button ref={closeRef} type="button" aria-label="Đóng thông báo trợ lý" onClick={() => { setVisible(false); buttonRef.current?.focus(); }}><SymbolIcon name="close" size={20} /></button><SymbolIcon name="chat" size={29} /><h2 id="chat-title">Hỏi Chuồn Chuồn</h2><p>{state === 'loading' ? 'Trợ lý đang kết nối. Bạn thử lại sau một chút nhé.' : state === 'unavailable' ? 'Trợ lý tạm thời chưa kết nối được. Bạn có thể gọi hotline để được hỗ trợ.' : 'Trợ lý đang sẵn sàng giúp bạn lên kế hoạch tham quan.'}</p><a href={PHONE}>Gọi 070 288 2299 <SymbolIcon name="arrow" size={17} /></a></section>}
    <span className="chat-hint" aria-hidden="true">Bạn cần giúp đỡ gì không?</span><button ref={buttonRef} className="chat-leaf" type="button" aria-label="Hỏi Chuồn Chuồn" aria-expanded={visible} aria-controls={visible ? 'garden-chat-panel' : undefined} onClick={() => { if (visible) setVisible(false); else if (!open()) setVisible(true); }}><SymbolIcon name="leaf" size={29} /></button>
  </div>;
}

export default function Page() {
  const rootRef = usePageMotion();
  return <div className="cc-site" lang="vi" ref={rootRef}>
    <style jsx global>{STYLES}</style>
    <a className="skip-link" href="#noi-dung">Đến nội dung chính</a>
    <div className="reading-progress" aria-hidden="true" />
    <Header />
    <main id="noi-dung"><Hero /><Intro /><Experiences /><Momentum /><Tickets /><Gallery /><Plan /><Visit /><Groups /></main>
    <Footer /><GardenChat />
  </div>;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
  :root { --pine:#183f38; --forest:#214f43; --deep:#123a34; --lime:#ddf373; --cream:#f6f7eb; --sand:#f1f2e6; --ink:#15342f; --muted:#5d746b; }
  html { scroll-behavior:smooth; scroll-padding-top:90px; } body { margin:0; } * { box-sizing:border-box; }
  .cc-site { overflow:clip; background:var(--cream); color:var(--ink); font-family:'DM Sans',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
  .cc-site h1,.cc-site h2,.cc-site h3,.cc-site p,.cc-site figure { margin:0; } .cc-site h1,.cc-site h2,.cc-site h3 { font-family:'Manrope','DM Sans',Arial,sans-serif; }
  .cc-site a { color:inherit; text-decoration:none; } .cc-site button { font:inherit; cursor:pointer; } .cc-site img { display:block; width:100%; height:100%; object-fit:cover; }
  .cc-site :where(a,button,[tabindex]):focus-visible { outline:3px solid #b8d83e; outline-offset:4px; } .cc-site ::selection { background:#def378; color:#17372f; }
  .section-shell { max-width:1460px; margin-inline:auto; padding-inline:clamp(24px,6vw,100px); } .eyebrow { color:#5a805c; font-size:11px; font-weight:800; letter-spacing:.17em; }
  .cc-site h2 { font-size:clamp(2.8rem,5.4vw,5.8rem); line-height:1.11; letter-spacing:-.07em; font-weight:750; } .cc-site h2 em,.cc-site h1 em,.cc-site h3 em { font-family:Georgia,'Times New Roman',serif; font-weight:400; letter-spacing:-.055em; }
  .reading-progress { position:fixed; z-index:100; top:0; left:0; width:100%; height:4px; transform-origin:left; transform:scaleX(var(--page-progress,0)); background:var(--lime); pointer-events:none; }
  .skip-link { position:fixed; z-index:200; top:-90px; left:16px; padding:12px 18px; background:var(--lime); border-radius:12px; } .skip-link:focus { top:12px; }
  .site-header { position:fixed; z-index:80; left:0; right:0; top:0; color:white; transition:background .35s,box-shadow .35s,color .35s; }
  .site-header.header-solid { background:rgba(247,248,238,.94); color:var(--ink); box-shadow:0 8px 30px #123a3410; backdrop-filter:blur(18px); }
  .header-inner { height:90px; max-width:1600px; margin:auto; padding:0 clamp(22px,5vw,78px); display:flex; align-items:center; gap:clamp(25px,4vw,70px); }
  .wordmark { display:inline-flex; align-items:center; gap:12px; white-space:nowrap; flex-shrink:0; } .wordmark-text { display:flex; flex-direction:column; gap:2px; }
  .wordmark strong { font-size:17px; font-weight:800; letter-spacing:.085em; } .wordmark small { font-size:9px; letter-spacing:.16em; font-weight:700; opacity:.8; }
  .wordmark-emblem { width:37px; height:37px; display:block; position:relative; transform:rotate(-15deg); }
  .emblem-body { position:absolute; width:3px; height:29px; left:17px; top:5px; border-radius:10px; background:currentColor; }
  .wing { position:absolute; width:17px; height:9px; border:2px solid currentColor; border-radius:100% 20% 100% 20%; } .wing-a { left:1px; top:6px; transform:rotate(23deg); } .wing-b { left:19px; top:7px; transform:rotate(157deg); } .wing-c { left:2px; top:18px; transform:rotate(-24deg); } .wing-d { left:18px; top:19px; transform:rotate(204deg); }
  .desktop-nav { display:flex; justify-content:center; gap:clamp(17px,2.2vw,34px); flex:1; } .desktop-nav a { font-size:13px; font-weight:700; opacity:.92; white-space:nowrap; transition:opacity .25s; } .desktop-nav a:hover { opacity:.6; }
  .nav-map { display:inline-flex; align-items:center; gap:10px; border:1px solid currentColor; padding:13px 17px; border-radius:30px; font-weight:700; font-size:12px; white-space:nowrap; transition:background .25s,color .25s; } .nav-map:hover { background:var(--lime); color:var(--ink); border-color:var(--lime); }
  .mobile-toggle,.mobile-nav { display:none; }
  .hero { height:min(860px,100svh); min-height:680px; position:relative; color:white; background:#445a48; }
  .hero-photo,.hero-wash { position:absolute; inset:0; } .hero-photo { overflow:hidden; } .hero-photo img { object-position:center 43%; transform:translateY(var(--hero-scroll,0px)) scale(1.1); } .hero-wash { background:linear-gradient(90deg,rgba(14,42,31,.82) 0%,rgba(14,42,31,.48) 43%,rgba(14,42,31,.08) 100%),linear-gradient(0deg,rgba(14,42,31,.64),transparent 31%); }
  .hero-content { position:absolute; z-index:2; width:min(760px,80vw); left:max(6vw,calc((100vw - 1300px)/2)); top:50%; transform:translateY(-41%); }
  .hero-kicker { display:flex; align-items:center; gap:10px; letter-spacing:.19em; font-size:11px; font-weight:800; } .pulse-dot { display:inline-block; width:9px; height:9px; border-radius:50%; background:var(--lime); box-shadow:0 0 0 5px #ddf37338; }
  .hero h1 { font-size:clamp(6rem,11.5vw,11rem); line-height:.92; font-weight:800; letter-spacing:-.11em; margin:32px 0 35px; } .hero h1 em { color:var(--lime); font-size:1.04em; }
  .hero-content p { max-width:460px; font-size:16px; line-height:1.75; color:#fffef0; } .hero-actions { display:flex; align-items:center; gap:30px; margin-top:34px; }
  .button { min-height:56px; display:inline-flex; justify-content:center; align-items:center; gap:32px; padding:15px 22px; border-radius:999px; font-weight:800; font-size:13px; transition:transform .3s,box-shadow .3s,background .3s; white-space:nowrap; } .button:hover { transform:translateY(-4px); box-shadow:0 14px 30px #142c2730; } .button-light { color:var(--ink)!important; background:var(--lime); } .button-dark { background:var(--pine); color:white!important; } .button-outline-light { border:1px solid white; color:white!important; }
  .hero-link { font-size:13px; font-weight:800; border-bottom:1px solid #ffffff90; padding-bottom:6px; } .hero-link span { margin-left:12px; }
  .hero-index { position:absolute; right:6vw; top:48%; transform:translateY(-50%) rotate(90deg); letter-spacing:.22em; font-size:10px; font-weight:800; } .hero-index span { opacity:.5; padding:0 8px; }
  .hero-scroll { position:absolute; left:6vw; bottom:105px; display:flex; align-items:center; gap:20px; font-size:10px; letter-spacing:.18em; font-weight:800; }
  .hero-bottom { position:absolute; left:0; right:0; bottom:0; height:65px; border-top:1px solid #ffffff70; display:flex; align-items:center; gap:44px; padding:0 6vw; background:#112e2b38; backdrop-filter:blur(8px); font-size:10px; font-weight:800; letter-spacing:.1em; } .hero-bottom div { display:flex; align-items:center; gap:10px; } .hero-bottom>span { margin-left:auto; opacity:.8; }
  .intro { padding-top:82px; padding-bottom:145px; } .intro-topline { display:flex; justify-content:space-between; padding-bottom:16px; border-bottom:1px solid #93aa9880; color:#6a8277; font-size:10px; font-weight:800; letter-spacing:.14em; }
  .intro-grid { display:grid; grid-template-columns:30% 1fr; gap:8%; margin-top:110px; } .intro-side { display:flex; flex-direction:column; justify-content:space-between; color:#668a65; font-size:10px; font-weight:800; letter-spacing:.17em; } .big-sun { font-size:clamp(140px,19vw,280px); line-height:.8; font-family:Georgia,serif; color:#d3e790; font-weight:400; transform:rotate(-18deg); }
  .intro h2 { max-width:800px; } .intro h2 em { color:#779150; } .intro-grid p { max-width:610px; font-size:16px; line-height:1.9; color:#526c61; margin-top:32px; }
  .text-link { display:inline-flex; gap:32px; align-items:center; margin-top:29px; padding-bottom:8px; border-bottom:1px solid var(--ink); font-weight:800; font-size:13px; }
  .intro-photo-grid { display:grid; grid-template-columns:1.05fr 1.1fr .8fr; gap:20px; align-items:start; margin-top:95px; } .intro-picture { height:clamp(270px,32vw,460px); position:relative; overflow:hidden; border-radius:10px; } .intro-picture img { transition:transform .85s cubic-bezier(.2,.7,.2,1); } .intro-picture:hover img { transform:scale(1.07); } .intro-picture-b { margin-top:90px; height:clamp(300px,38vw,550px); } .intro-picture-c { margin-top:34px; height:clamp(250px,28vw,410px); }
  .intro-picture figcaption { position:absolute; bottom:15px; left:15px; padding:10px 15px; border-radius:999px; background:#f8f8eced; color:var(--ink); font-size:11px; font-weight:800; }
  .experiences { background:#e9f0d7; padding:115px 0 96px; overflow:hidden; } .section-heading h2 em { color:#7a965a; } .heading-row { display:flex; justify-content:space-between; align-items:end; gap:40px; margin-top:24px; } .heading-row p { max-width:300px; font-size:15px; line-height:1.8; color:#5b7466; padding-bottom:9px; }
  .slide-track { height:185px; margin:55px -2vw -4px; position:relative; } .slide-track svg { width:100%; height:100%; overflow:visible; } .track-main,.track-shadow { fill:none; stroke-linecap:round; } .track-shadow { stroke:#b9c6a3; stroke-width:26px; } .track-main { stroke:#f7f7dc; stroke-width:22px; stroke-dasharray:5 18; } .track-rider { position:absolute; left:calc(3% + (var(--page-progress,0) * 89%)); top:45%; width:46px; height:46px; display:grid; place-items:center; border-radius:50%; background:#e5f58a; color:var(--pine); box-shadow:0 4px 0 #798d5a; font-size:20px; transform:translate(-50%,-50%); transition:left .12s linear,top .12s linear; }
  .rail-head { display:flex; justify-content:space-between; align-items:center; margin:0 0 22px; } .rail-head>span { display:flex; align-items:center; gap:13px; font-size:10px; letter-spacing:.16em; font-weight:800; } .rail-buttons { display:flex; gap:8px; } .rail-buttons button { width:47px; height:47px; border:1px solid #7f9d76; background:transparent; color:var(--ink); border-radius:50%; display:grid; place-items:center; transition:background .2s; } .rail-buttons button:hover { background:var(--lime); } .flip { transform:rotate(180deg); }
  .experience-rail { display:flex; overflow-x:auto; overscroll-behavior-x:contain; scroll-snap-type:x mandatory; scrollbar-width:none; gap:20px; padding:0 max(6vw,calc((100vw - 1260px)/2)) 10px; } .experience-rail::-webkit-scrollbar { display:none; } .experience-card { width:clamp(285px,34vw,465px); flex:none; scroll-snap-align:start; border-radius:12px; overflow:hidden; background:#f9faef; } .experience-image { height:clamp(265px,31vw,410px); position:relative; overflow:hidden; } .experience-image img { transition:transform .8s; } .experience-card:hover img { transform:scale(1.06); } .card-index { position:absolute; right:17px; top:17px; border-radius:50px; background:#f9faef; padding:8px 13px; font-size:10px; font-weight:800; }
  .experience-info { padding:27px 27px 34px; min-height:207px; } .experience-info>span { color:#6a9166; font-size:10px; font-weight:800; letter-spacing:.14em; } .experience-info h3 { margin:14px 0 11px; font-size:clamp(20px,2.5vw,28px); letter-spacing:-.05em; } .experience-info p { font-size:13px; line-height:1.75; color:#65766d; }
  .experience-note { display:flex; align-items:center; gap:15px; margin-top:25px; font-size:12px; line-height:1.6; color:#587063; } .experience-note a { display:inline-flex; align-items:center; gap:5px; white-space:nowrap; text-decoration:underline; text-underline-offset:3px; font-weight:700; }
  .momentum { height:min(730px,70vw); min-height:510px; position:relative; overflow:hidden; color:#fff; } .momentum-image,.momentum-overlay { position:absolute; inset:0; } .momentum-image img { object-position:center 57%; } .momentum-overlay { background:linear-gradient(90deg,#0e2d27bd,transparent 90%),linear-gradient(0deg,#102e298c,transparent 50%); }
  .momentum-content { position:absolute; left:max(6vw,calc((100vw - 1300px)/2)); bottom:15%; } .momentum-content .eyebrow { color:#e1f28e; } .momentum-content p { font-family:'Manrope',sans-serif; font-size:clamp(2.9rem,5.5vw,6rem); line-height:1.16; letter-spacing:-.065em; font-weight:800; margin:27px 0 34px; } .momentum-content em { font-family:Georgia,serif; font-weight:400; } .momentum-corner { position:absolute; top:30px; right:5vw; font-size:10px; letter-spacing:.16em; font-weight:800; }
  .tickets { padding-top:135px; padding-bottom:125px; display:grid; grid-template-columns:.85fr 1.15fr; gap:5% 8%; } .ticket-intro h2 { margin-top:25px; } .ticket-intro h2 em { color:#7a9551; } .ticket-intro>p { color:#61766b; line-height:1.85; font-size:15px; max-width:480px; margin:24px 0 30px; } .ticket-stamp { display:inline-flex; align-items:center; gap:9px; padding:11px 15px; border:1px solid #b9cbb1; border-radius:50px; font-weight:800; letter-spacing:.1em; font-size:10px; }
  .ticket-stack { display:flex; flex-direction:column; gap:18px; padding-top:7px; } .ticket-card { position:relative; overflow:hidden; min-height:225px; border-radius:18px; padding:29px 33px; } .ticket-adult { background:#c7e986; } .ticket-child { background:#dcecdf; } .ticket-card-top { display:flex; justify-content:space-between; font-size:10px; letter-spacing:.15em; font-weight:800; } .ticket-price { display:flex; align-items:baseline; gap:9px; margin-top:35px; } .ticket-price strong { font:800 clamp(2.9rem,5vw,4.5rem)/1 'Manrope',sans-serif; letter-spacing:-.09em; } .ticket-price span { font-size:14px; font-weight:700; } .ticket-card p { font-size:13px; font-weight:700; margin-top:12px; } .ticket-pattern { position:absolute; font-size:190px; line-height:1; right:-20px; bottom:-82px; color:#ffffff55; font-family:Georgia,serif; pointer-events:none; }
  .ticket-details { grid-column:1/-1; display:grid; grid-template-columns:1fr 1fr; gap:50px; margin-top:20px; border-top:1px solid #a4b9a7; padding-top:32px; } .ticket-details>div { display:flex; gap:19px; } .detail-circle { flex:none; display:grid; place-items:center; width:45px; height:45px; background:#e6eed6; border-radius:50%; } .ticket-details h3 { font-size:18px; letter-spacing:-.04em; margin:3px 0 8px; } .ticket-details p { font-size:13px; line-height:1.8; color:#5c7468; max-width:475px; }
  .gallery { background:#f1f1e8; padding:125px 0; } .gallery-heading { display:flex; align-items:end; justify-content:space-between; gap:40px; margin-bottom:50px; } .gallery-heading h2 { margin-top:22px; } .gallery-heading em { color:#78985e; } .gallery-heading p { max-width:350px; color:#63766b; font-size:14px; line-height:1.8; }
  .gallery-grid { display:grid; grid-template-columns:repeat(12,1fr); grid-template-rows:275px 275px; gap:16px; } .gallery-frame { position:relative; min-width:0; min-height:0; border-radius:9px; overflow:hidden; background:#e4e9da; } .gallery-frame img { transition:transform .75s; } .gallery-frame:hover img { transform:scale(1.07); } .gallery-frame figcaption { position:absolute; bottom:12px; left:12px; background:#fafbf2e9; padding:9px 12px; border-radius:50px; font-size:10px; font-weight:700; } .gallery-frame.g1 { grid-column:span 5; grid-row:span 2; } .gallery-frame.g2 { grid-column:span 4; } .gallery-frame.g3 { grid-column:span 3; } .gallery-frame.g3 img { object-fit:none; background:#dfead9; image-rendering:auto; } .gallery-frame.g4 { grid-column:span 3; } .gallery-frame.g5 { grid-column:span 4; } .gallery-frame.g4 img,.gallery-frame.g5 img { object-fit:contain; background:#e2eada; }
  .plan { padding:130px 0 125px; background:#eaf0e4; } .plan-heading h2 { margin-top:24px; } .plan-heading em { color:#7c9b5d; } .plan-grid { display:grid; grid-template-columns:.88fr 1.12fr; gap:8%; margin-top:65px; } .plan-lead { position:relative; height:650px; border-radius:11px; overflow:hidden; } .plan-lead::after { content:''; position:absolute; inset:40% 0 0; background:linear-gradient(transparent,#10352dbc); } .plan-lead>div { position:absolute; z-index:1; bottom:38px; left:35px; right:35px; color:white; } .plan-lead span { font-size:10px; letter-spacing:.18em; font-weight:800; } .plan-lead p { font-size:19px; line-height:1.55; letter-spacing:-.02em; font-weight:600; margin-top:17px; max-width:400px; }
  .plan-facts { display:grid; grid-template-columns:1fr 1fr; gap:0 29px; } .fact { padding:30px 0; border-top:1px solid #acc0a9; } .fact span { display:block; color:#728b75; font-size:10px; font-weight:800; letter-spacing:.14em; margin-bottom:25px; } .fact strong { display:block; font-size:clamp(21px,2.3vw,29px); letter-spacing:-.05em; } .fact p { margin-top:12px; color:#5f7768; font-size:13px; line-height:1.8; }
  .faq { display:grid; grid-template-columns:30% 1fr; gap:7%; margin-top:120px; border-top:1px solid #acc0a9; padding-top:65px; } .faq-intro h3 { font-size:clamp(2.4rem,4vw,4.6rem); letter-spacing:-.07em; line-height:1.1; margin-top:20px; } .faq-intro em { color:#72904f; } .faq-item { border-bottom:1px solid #acc0a9; } .faq-item button { width:100%; min-height:76px; border:0; background:none; text-align:left; display:flex; align-items:center; gap:18px; color:var(--ink); font-size:15px; font-weight:700; } .faq-item button>span { font-size:11px; color:#829c76; } .faq-item button>b { margin-left:auto; font-size:23px; font-weight:400; } .faq-answer p { padding:0 35px 25px; color:#597263; line-height:1.8; font-size:13px; max-width:650px; }
  .visit { min-height:660px; display:grid; grid-template-columns:1fr 1fr; background:#e1eadb; } .visit-image { min-height:660px; } .visit-panel { padding:clamp(50px,8vw,112px); display:flex; flex-direction:column; align-items:flex-start; justify-content:center; } .visit-panel h2 { margin:26px 0 38px; } .visit-panel em { color:#7b9955; } .visit-address { display:flex; gap:17px; align-items:flex-start; } .visit-address>div>span { font-size:10px; color:#64826a; letter-spacing:.16em; font-weight:800; } .visit-address p { margin-top:8px; font-size:18px; font-weight:700; line-height:1.5; } .visit-micro { display:flex; gap:40px; border-top:1px solid #afc1ac; margin-top:28px; padding-top:25px; } .visit-micro div { display:flex; flex-direction:column; gap:5px; } .visit-micro strong { font-size:21px; letter-spacing:-.04em; } .visit-micro span { font-size:11px; color:#60796b; } .visit-time { font-size:12px; line-height:1.7; max-width:370px; color:#60796b; margin:25px 0; }
  .groups { position:relative; text-align:center; padding-top:140px; padding-bottom:150px; overflow:hidden; } .groups-flower { position:absolute; z-index:0; left:50%; top:4%; transform:translateX(-50%) rotate(-18deg); color:#e7f0d4; font:400 520px/1 Georgia,serif; pointer-events:none; } .groups>:not(.groups-flower) { position:relative; z-index:1; } .groups h2 { margin:24px 0; } .groups h2 em { color:#7c9859; } .groups>p { max-width:560px; margin:0 auto; line-height:1.85; color:#64786b; font-size:15px; } .group-actions { display:flex; justify-content:center; align-items:center; gap:30px; margin-top:33px; } .group-phone { display:flex; align-items:center; gap:9px; font-size:14px; font-weight:700; } .group-small { margin-top:24px; font-size:11px; color:#769079; }
  .footer { background:#153c35; color:white; } .footer-top { min-height:355px; display:grid; grid-template-columns:1.5fr .7fr 1.1fr .4fr; gap:30px; padding-top:80px; padding-bottom:60px; } .footer-top>div:first-child p { color:#bed4c3; margin-top:24px; line-height:1.7; font-size:14px; } .footer-top>div:nth-child(2),.footer-top>div:nth-child(3) { display:flex; flex-direction:column; align-items:flex-start; gap:15px; } .footer-top strong { font-size:10px; letter-spacing:.17em; color:#a2c799; margin-bottom:11px; } .footer-top a:not(.wordmark) { color:#e0ece0; font-size:13px; line-height:1.5; } .footer-top a:hover { color:var(--lime); } .footer-sun { font:160px/.9 Georgia,serif; color:#8cad7166; justify-self:end; } .footer-bottom { min-height:62px; border-top:1px solid #ffffff38; display:flex; justify-content:space-between; align-items:center; gap:16px; font-size:10px; letter-spacing:.1em; color:#b3cdbc; } .footer-bottom a { color:white; }
  .chat-widget { position:fixed; z-index:90; right:25px; bottom:25px; display:flex; align-items:center; gap:10px; margin-bottom:env(safe-area-inset-bottom,0px); } .chat-hint { background:#fffef2; border:1px solid #d9e6ce; color:#21483d; border-radius:99px; padding:11px 15px; box-shadow:0 8px 20px #123a3420; font-size:12px; font-weight:700; white-space:nowrap; pointer-events:none; } .chat-leaf { display:grid; place-items:center; border:4px solid #f1f7db; color:#fff; background:#214e40; border-radius:50%; width:64px; height:64px; box-shadow:0 8px 30px #123a3450; transition:transform .25s; } .chat-leaf:hover { transform:scale(1.07) rotate(-8deg); } .chat-panel { position:absolute; right:0; bottom:80px; width:min(340px,calc(100vw - 35px)); background:#fffef4; color:#20473d; border:1px solid #cbdcc6; border-radius:22px; padding:23px; box-shadow:0 20px 45px #163c3540; animation:pop .25s ease both; } .chat-panel>button { float:right; background:transparent; border:0; color:inherit; } .chat-panel h2 { font-size:21px; margin:14px 0 8px; letter-spacing:-.04em; } .chat-panel p { font-size:13px; line-height:1.7; color:#60766a; margin-bottom:17px; } .chat-panel a { display:inline-flex; align-items:center; gap:10px; font-size:13px; font-weight:800; } @keyframes pop { from { opacity:0; transform:translateY(9px); } to { opacity:1; transform:translateY(0); } }
  .motion-ready [data-reveal]:not(.is-visible) { opacity:0; transform:translateY(32px); } [data-reveal] { transition:opacity .8s ease,transform .8s cubic-bezier(.18,.7,.25,1); } [data-reveal].is-visible { opacity:1; transform:translateY(0); }
  @media (max-width:1150px) { .desktop-nav { gap:14px; } .desktop-nav a { font-size:11px; } .nav-map { padding:11px 13px; } .wordmark strong { font-size:15px; } .header-inner { gap:20px; } }
  @media (max-width:850px) { .desktop-nav,.nav-map { display:none; } .header-inner { height:76px; justify-content:space-between; } .mobile-toggle { display:grid; place-items:center; border:1px solid currentColor; background:transparent; color:inherit; width:44px; height:44px; border-radius:50%; } .mobile-nav { display:flex; flex-direction:column; background:#f7f8ee; color:var(--ink); padding:15px 24px 30px; max-height:calc(100svh - 76px); overflow:auto; } .mobile-nav a { display:flex; align-items:center; gap:18px; border-bottom:1px solid #d3dfcb; padding:16px 0; font-size:20px; font-weight:800; } .mobile-nav a span { color:#79977b; font-size:11px; } .mobile-nav svg { margin-left:auto; } .hero h1 { font-size:clamp(5.5rem,14vw,8rem); } .intro-grid { grid-template-columns:1fr; margin-top:60px; } .intro-side { display:none; } .heading-row { align-items:start; flex-direction:column; gap:16px; } .slide-track { height:115px; margin-top:30px; } .experience-note { flex-direction:column; align-items:start; } .tickets { grid-template-columns:1fr; } .ticket-details { grid-column:auto; } .gallery-grid { grid-template-rows:200px 200px; } .plan-grid { grid-template-columns:1fr; } .plan-lead { height:520px; } .plan-facts { margin-top:20px; } .faq { margin-top:70px; } .visit-panel { padding:60px 40px; } .visit-micro { gap:22px; } .footer-top { grid-template-columns:1.2fr 1fr 1fr; } .footer-sun { display:none; } }
  @media (max-width:600px) { html { scroll-padding-top:70px; } .section-shell { padding-inline:22px; } .eyebrow { font-size:10px; } .cc-site h2 { font-size:clamp(2.65rem,11vw,4.1rem); } .wordmark-emblem { width:32px; transform:scale(.85) rotate(-15deg); } .wordmark strong { font-size:13px; } .wordmark small { font-size:7px; } .hero { height:790px; min-height:700px; max-height:920px; } .hero-photo img { object-position:57% center; } .hero-wash { background:linear-gradient(90deg,#0d3027bd,#0d30273d),linear-gradient(0deg,#0d3027c0,transparent 50%); } .hero-content { top:44%; left:22px; width:calc(100% - 40px); transform:translateY(-30%); } .hero-kicker { font-size:9px; letter-spacing:.12em; } .hero h1 { font-size:clamp(5.2rem,17vw,7.2rem); margin:22px 0 23px; } .hero-content p { font-size:14px; max-width:300px; } .hero-actions { gap:20px; flex-wrap:wrap; } .hero-link { font-size:12px; } .hero-index,.hero-scroll,.hero-bottom>span { display:none; } .hero-bottom { height:82px; gap:7px; flex-direction:column; align-items:flex-start; justify-content:center; padding-left:22px; font-size:9px; } .hero-bottom svg { width:15px; } .intro { padding-top:50px; padding-bottom:85px; } .intro-topline>span:last-child { display:none; } .intro-grid { margin-top:50px; } .intro-grid p { font-size:14px; margin-top:22px; } .intro-photo-grid { grid-template-columns:1fr 1fr; gap:10px; margin-top:50px; } .intro-picture { height:235px; } .intro-picture-b { margin-top:30px; height:235px; } .intro-picture-c { grid-column:1/-1; margin:0; height:200px; } .intro-picture figcaption { font-size:9px; left:8px; bottom:8px; padding:6px 9px; } .experiences { padding:80px 0 70px; } .heading-row p { font-size:13px; } .slide-track { height:85px; margin:22px -20px 4px; } .track-rider { width:31px; height:31px; font-size:15px; } .rail-head>span { font-size:9px; } .rail-buttons button { width:38px; height:38px; } .experience-rail { padding-left:22px; padding-right:22px; gap:12px; } .experience-card { width:82vw; } .experience-image { height:310px; } .experience-info { min-height:210px; } .experience-note { font-size:11px; } .momentum { min-height:520px; } .momentum-image img { object-position:59% center; } .momentum-content { left:22px; bottom:60px; right:22px; } .momentum-content p { font-size:clamp(2.8rem,10vw,4.4rem); } .momentum-corner { display:none; } .tickets { padding-top:85px; padding-bottom:85px; gap:35px; } .ticket-intro>p { font-size:13px; } .ticket-card { min-height:190px; padding:23px; } .ticket-price { margin-top:31px; } .ticket-price strong { font-size:3.2rem; } .ticket-details { grid-template-columns:1fr; gap:25px; } .gallery { padding:80px 0; } .gallery-heading { display:block; } .gallery-heading p { margin-top:20px; font-size:13px; } .gallery-grid { grid-template-columns:1fr 1fr; grid-template-rows:none; gap:10px; } .gallery-frame.g1 { grid-column:1/-1; grid-row:auto; height:280px; } .gallery-frame.g2,.gallery-frame.g3,.gallery-frame.g4,.gallery-frame.g5 { grid-column:span 1; height:185px; } .gallery-frame figcaption { font-size:8px; max-width:calc(100% - 12px); left:6px; bottom:6px; padding:6px; } .plan { padding:80px 0; } .plan-grid { margin-top:40px; } .plan-lead { height:420px; } .plan-lead>div { bottom:24px; left:24px; right:24px; } .plan-lead p { font-size:16px; } .plan-facts { gap:0 12px; } .fact { padding:22px 0; } .fact span { min-height:32px; margin-bottom:12px; font-size:8px; } .fact strong { font-size:18px; } .fact p { font-size:11px; } .faq { display:block; margin-top:50px; padding-top:40px; } .faq-intro { margin-bottom:25px; } .faq-item button { min-height:70px; font-size:13px; } .faq-answer p { padding-left:20px; } .visit { display:flex; flex-direction:column; } .visit-image { height:320px; min-height:0; } .visit-panel { padding:70px 22px; } .visit-address p { font-size:16px; } .visit-micro { gap:25px; } .visit-micro span { max-width:140px; } .groups { padding-top:100px; padding-bottom:100px; } .groups-flower { font-size:380px; } .groups>p { font-size:13px; } .group-actions { flex-direction:column; gap:20px; } .footer-top { grid-template-columns:1fr 1fr; gap:45px 20px; padding-top:70px; } .footer-top>div:first-child { grid-column:1/-1; } .footer-top>div:nth-child(3) a { overflow-wrap:anywhere; } .footer-bottom { flex-wrap:wrap; padding-top:25px; padding-bottom:85px; font-size:9px; } .footer-bottom span:nth-child(2) { display:none; } .chat-widget { right:16px; bottom:16px; } .chat-leaf { width:59px; height:59px; } .chat-hint { padding:10px; font-size:10px; } }
  @media (prefers-reduced-motion:reduce) { html { scroll-behavior:auto; } .cc-site *, .cc-site *::before,.cc-site *::after { animation-duration:.01ms!important; transition-duration:.01ms!important; scroll-behavior:auto!important; } .hero-photo img { transform:none; } }
`;
