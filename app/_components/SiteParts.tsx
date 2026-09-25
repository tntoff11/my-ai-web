'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode, SVGProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  { href: '/trai-nghiem', label: 'Trải nghiệm' },
  { href: '/gia-ve', label: 'Giá vé' },
  { href: '/len-ke-hoach', label: 'Lên kế hoạch' },
  { href: '/duong-di', label: 'Đường đi' },
  { href: '/khach-doan', label: 'Khách đoàn' },
];

function Wordmark({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`wordmark ${light ? 'wordmark-light' : ''}`} aria-label="Chuồn Chuồn Coffee & Bistro - Về trang chủ">
    <span className="logo-source"><img src="/images/chuon-chuon/logo-coffee-bistro.png" alt="Biểu trưng Chuồn Chuồn Coffee & Bistro" /></span>
    <span className="wordmark-text"><strong>Chuồn Chuồn</strong><small>COFFEE & BISTRO</small></span>
  </Link>;
}

export function usePageMotion() {
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

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 50);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [open]);
  return <header className={`site-header ${scrolled || open ? 'header-solid' : ''}`}>
    <div className="header-inner"><Wordmark /><nav className="desktop-nav" aria-label="Điều hướng chính">{NAV.map(item => <Link href={item.href} key={item.href} aria-current={pathname === item.href ? 'page' : undefined}>{item.label}</Link>)}</nav>
      <a className="nav-map" href={MAP} target="_blank" rel="noopener noreferrer"><SymbolIcon name="pin" size={17} /> Chỉ đường <SymbolIcon name="arrow" size={16} /></a>
      <button className="mobile-toggle" type="button" aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(v => !v)}><SymbolIcon name={open ? 'close' : 'menu'} size={25} /></button>
    </div>
    {open && <nav className="mobile-nav" id="mobile-navigation" aria-label="Điều hướng di động">{NAV.map((item, index) => <Link href={item.href} key={item.href} aria-current={pathname === item.href ? 'page' : undefined} onClick={() => setOpen(false)}><span>0{index + 1}</span>{item.label}<SymbolIcon name="arrow" size={19} /></Link>)}<a href={MAP} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Mở Google Maps <SymbolIcon name="arrow" size={19} /></a></nav>}
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

export function Hero() {
  return <section className="hero" id="dau-trang" aria-labelledby="hero-title">
    <div className="hero-photo"><img src={PHOTO.hero} alt="Lối đi uốn lượn giữa những dải hoa tím tại Chuồn Chuồn" fetchPriority="high" /></div><div className="hero-wash" />
    <div className="hero-content"><div className="hero-kicker"><span className="pulse-dot" /> MỘT NGÀY THẬT KHÁC · NAM BAN, LÂM ĐỒNG</div>
      <h1 id="hero-title">Đi theo<br /><em>lối vui.</em></h1>
      <p>Giữa đồi xanh và những con đường ngập hoa, mỗi khúc quanh lại mở ra một trải nghiệm mới.</p>
      <div className="hero-actions"><a className="button button-light" href="/trai-nghiem">Bắt đầu khám phá <SymbolIcon name="arrow" size={19} /></a><a className="hero-link" href="/gia-ve">Xem giá vé <span>↗</span></a></div>
    </div>
    <div className="hero-index" aria-hidden="true">01 <span>/</span> CHUỒN CHUỒN</div>
    <a href="/#gioi-thieu" className="hero-scroll" aria-label="Cuộn xuống tìm hiểu"><span>CUỘN ĐỂ KHÁM PHÁ</span><SymbolIcon name="down" size={17} /></a>
    <div className="hero-bottom"><div><SymbolIcon name="clock" size={18} /> 07:30 — 17:00 · HẰNG NGÀY</div><div><SymbolIcon name="pin" size={18} /> NAM BAN, LÂM ĐỒNG</div><span>KHÁM PHÁ THEO CÁCH CỦA BẠN</span></div>
  </section>;
}

export function Intro() {
  return <section className="intro section-shell" id="gioi-thieu"><div className="intro-topline"><span>01 / LỜI CHÀO TỪ CHUỒN CHUỒN</span><span>ĐIỂM DU LỊCH · THIÊN NHIÊN · TRẢI NGHIỆM</span></div>
    <div className="intro-grid"><div className="intro-side" data-reveal><span className="big-sun" aria-hidden="true">✳</span><span>MỘT KHOẢNG TRỜI CHO MỌI NGƯỜI</span></div>
      <div data-reveal><h2>Chuyến đi đẹp nhất<br />là chuyến đi <em>có điều để nhớ.</em></h2><p>Điểm Du Lịch Chuồn Chuồn là nơi tham quan, vui chơi và check-in giữa thiên nhiên Lâm Đồng. Từ vườn hoa, khu thú mini đến những trò chơi ngoài trời, mỗi người đều có thể chọn cho mình một nhịp khám phá riêng.</p><a href="/trai-nghiem" className="text-link">Theo dấu những trải nghiệm <SymbolIcon name="arrow" size={20} /></a></div></div>
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
export function Experiences() {
  const railRef = useRef<HTMLDivElement>(null);
  const step = (direction: number) => railRef.current?.scrollBy({ left: direction * Math.min(480, railRef.current.clientWidth * .85), behavior: 'smooth' });
  return <section className="experiences" id="trai-nghiem" aria-labelledby="experience-title"><div className="section-shell experiences-inner"><div className="section-heading" data-reveal><span className="eyebrow">02 / HÀNH TRÌNH TRẢI NGHIỆM</span><div className="heading-row"><h2 id="experience-title">Có một <em>lối vui</em><br />dành cho bạn.</h2><p>Trượt qua những mảnh ghép của Chuồn Chuồn. Mỗi điểm dừng là một lý do để ở lại thêm một chút.</p></div></div>
    <SlideTrack /><div className="rail-head"><span>KÉO NGANG ĐỂ KHÁM PHÁ <SymbolIcon name="arrow" size={17} /></span><div className="rail-buttons"><button type="button" aria-label="Xem trải nghiệm trước" onClick={() => step(-1)}><SymbolIcon name="arrow" size={20} className="flip" /></button><button type="button" aria-label="Xem trải nghiệm tiếp theo" onClick={() => step(1)}><SymbolIcon name="arrow" size={20} /></button></div></div></div>
    <div className="experience-rail" ref={railRef} tabIndex={0} aria-label="Danh sách trải nghiệm, cuộn ngang để xem thêm">{EXPERIENCES.map((item) => <article className="experience-card" key={item.no}><div className="experience-image"><img src={item.image} alt={item.alt} loading="lazy" /><span className="card-index">{item.no} / 05</span></div><div className="experience-info"><span>{item.type}</span><h3>{item.title}</h3><p>{item.desc}</p></div></article>)}</div>
    <div className="section-shell experience-note">Vé tham quan còn bao gồm Sky Line, trượt phao khô 7 sắc cầu vồng và xích đu ngắm cảnh. <a href="/len-ke-hoach#luu-y">Xem lưu ý tham gia <SymbolIcon name="arrow" size={16} /></a></div>
  </section>;
}

export function Momentum() {
  return <section className="momentum" aria-label="Khoảnh khắc tại Chuồn Chuồn"><div className="momentum-image"><img src={PHOTO.bridge} alt="Cầu tham quan với tầm nhìn ra đồi xanh tại Chuồn Chuồn" loading="lazy" /></div><div className="momentum-overlay" /><div className="momentum-content" data-reveal><span className="eyebrow">GIỮ LẠI MỘT KHOẢNH KHẮC</span><p>Đổi một lối rẽ.<br /><em>Mở cả một chân trời.</em></p><a href="/trai-nghiem#bo-suu-tap" className="button button-outline-light">Xem những góc hình <SymbolIcon name="arrow" size={19} /></a></div><span className="momentum-corner">CHUỒN CHUỒN / LÂM ĐỒNG</span></section>;
}

export function Tickets() {
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
export function Gallery() {
  return <section className="gallery" id="bo-suu-tap" aria-labelledby="gallery-title"><div className="section-shell gallery-heading" data-reveal><div><span className="eyebrow">04 / ALBUM CHUỒN CHUỒN</span><h2 id="gallery-title">Một nơi.<br /><em>Muôn góc nhìn.</em></h2></div><p>Những hình ảnh thật trong bộ tư liệu Chuồn Chuồn. Cảnh quan và tình trạng hoa có thể thay đổi theo mùa.</p></div><div className="gallery-grid section-shell">{GALLERY.map(item => <figure className={`gallery-frame ${item.cls}`} key={item.cls} data-reveal><img src={item.image} alt={item.alt} loading="lazy" /><figcaption>{item.note}</figcaption></figure>)}</div></section>;
}

export function Plan() {
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

export function Visit() {
  return <section className="visit" id="duong-di" aria-labelledby="visit-title"><div className="visit-image"><img src={PHOTO.hero} alt="Toàn cảnh lối đi và vườn hoa tại điểm du lịch" loading="lazy" /></div><div className="visit-panel" data-reveal><span className="eyebrow">06 / HẸN GẶP Ở CHUỒN CHUỒN</span><h2 id="visit-title">Lối vui<br /><em>bắt đầu ở đây.</em></h2><div className="visit-address"><SymbolIcon name="pin" size={25} /><div><span>ĐỊA CHỈ</span><p>217 Thôn 5, Nam Ban,<br />Lâm Đồng, Việt Nam</p></div></div><div className="visit-micro"><div><strong>18–20 km</strong><span>Từ trung tâm Đà Lạt</span></div><div><strong>Miễn phí</strong><span>Bãi đỗ xe máy, ô tô, xe đoàn</span></div></div><p className="visit-time">Thời gian từ trung tâm Đà Lạt thường khoảng 30–40 phút, tùy điểm xuất phát và giao thông.</p><a href={MAP} target="_blank" rel="noopener noreferrer" className="button button-dark">Mở Google Maps <SymbolIcon name="arrow" size={19} /></a></div></section>;
}

export function Groups() {
  return <section className="groups section-shell" id="khach-doan"><div className="groups-flower" aria-hidden="true">✳</div><span className="eyebrow">ĐI CÙNG NHAU, VUI HƠN NỮA</span><h2>Hẹn cả nhóm<br /><em>cùng khám phá.</em></h2><p>Chuồn Chuồn đón tiếp đoàn, trường học và doanh nghiệp. Liên hệ trước để được tư vấn hoạt động, ăn uống và cách chuẩn bị phù hợp cho đoàn của bạn.</p><div className="group-actions"><a className="button button-dark" href={EMAIL}>Gửi yêu cầu tư vấn <SymbolIcon name="arrow" size={18} /></a><a className="group-phone" href={PHONE}><SymbolIcon name="phone" size={18} /> 070 288 2299</a></div><div className="group-small">Hotline có nhân viên tiếp nhận: 08:00 — 17:30</div></section>;
}

export function Footer() {
  return <footer className="footer"><div className="footer-top section-shell"><div><Wordmark light /><p>Một chuyến đi qua đồi xanh,<br />và những điều vui ở mỗi khúc quanh.</p></div><div><strong>KHÁM PHÁ</strong>{NAV.map(item => <Link href={item.href} key={item.href}>{item.label}</Link>)}</div><div><strong>LIÊN HỆ</strong><a href={PHONE}>070 288 2299</a><a href={EMAIL}>kinhdoanh.chuonchuon@gmail.com</a><a href={MAP} target="_blank" rel="noopener noreferrer">217 Thôn 5, Nam Ban, Lâm Đồng ↗</a></div><div className="footer-sun" aria-hidden="true">✳</div></div><div className="footer-bottom section-shell"><span>© 2026 ĐIỂM DU LỊCH CHUỒN CHUỒN</span><span>GIỮ NHỊP VUI TRONG TỪNG CHUYẾN ĐI</span><Link href="/">LÊN ĐẦU TRANG ↑</Link></div></footer>;
}

export function GardenChat() {
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


export function PageBanner({ eyebrow, title, accent, image, alt, intro }: { eyebrow:string; title:string; accent:string; image:string; alt:string; intro:string }) {
  return <section className="page-banner"><div className="page-banner-photo"><img src={image} alt={alt} fetchPriority="high" /></div><div className="page-banner-shade" /><div className="page-banner-content"><span className="eyebrow">{eyebrow}</span><h1>{title}<br /><em>{accent}</em></h1><p>{intro}</p></div></section>;
}
export function RouteMotion({ children }: { children:ReactNode }) {
  const rootRef=usePageMotion();
  return <div ref={rootRef} className="route-motion">{children}</div>;
}
export function HomeRoutes() {
  const items=[
    {url:'/trai-nghiem',number:'01',label:'Trải nghiệm',image:PHOTO.animal,alt:'Gia đình ở khu thú mini'},
    {url:'/gia-ve',number:'02',label:'Giá vé',image:PHOTO.flowers,alt:'Vườn hoa tại Chuồn Chuồn'},
    {url:'/len-ke-hoach',number:'03',label:'Lên kế hoạch',image:PHOTO.path,alt:'Lối đi giữa vườn hoa'},
    {url:'/duong-di',number:'04',label:'Đường đi',image:PHOTO.bridge,alt:'Cầu tham quan ở Chuồn Chuồn'},
  ];
  return <section className="home-routes section-shell"><span className="eyebrow">ĐIỂM BẮT ĐẦU CHO CHUYẾN ĐI CỦA BẠN</span><h2>Chọn một lối.<br /><em>Mở một hành trình.</em></h2><div className="home-route-grid">{items.map(item=><Link href={item.url} className="home-route-card" key={item.url}><img src={item.image} alt={item.alt} loading="lazy" /><div><span>{item.number} / KHÁM PHÁ</span><h3>{item.label}</h3><SymbolIcon name="arrow" size={24} /></div></Link>)}</div></section>;
}
export function TicketPolicy() {
  return <section className="policy-panel section-shell"><div><span className="eyebrow">MUA VÉ NHƯ THẾ NÀO?</span><h2>Đến nơi.<br /><em>Mua vé tại quầy.</em></h2></div><div><p>Hiện tại vé được mua trực tiếp tại điểm tham quan, không yêu cầu đặt trước đối với khách lẻ. Bạn có thể thanh toán bằng tiền mặt hoặc chuyển khoản. Giá vé đã bao gồm VAT.</p><p>Sau khi mua, vé không áp dụng đổi ngày, hủy hoặc hoàn tiền, kể cả trong trường hợp mưa hoặc thời tiết xấu.</p><a href="/duong-di" className="text-link">Xem đường đi <SymbolIcon name="arrow" size={19} /></a></div></section>;
}
export function TravelNotes() {
  return <section className="policy-panel section-shell"><div><span className="eyebrow">TRƯỚC KHI ĐẾN</span><h2>Một vài<br /><em>điều nên biết.</em></h2></div><div><p>Bãi đỗ xe cho xe máy, ô tô và xe đoàn được miễn phí. Một số lối tham quan trên địa hình đồi có độ dốc và không thuận tiện cho người dùng xe lăn.</p><p>Khách có thể mang snack nhẹ với số lượng phù hợp; đồ ăn và thức uống từ bên ngoài không được mang vào theo quy định doanh nghiệp cung cấp.</p><a href="tel:+84702882299" className="text-link">Hỏi trực tiếp nhân viên <SymbolIcon name="arrow" size={19} /></a></div></section>;
}
