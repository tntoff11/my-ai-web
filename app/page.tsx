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

function createCozeOptions(): Record<string, unknown> {
  // Isolated adapter matching Coze Web SDK 1.2.0-beta.6 installation syntax.
  return {
    config: { bot_id: COZE_CONFIG.botId },
    componentProps: { title: 'Chuồn Chuồn Garden Concierge' },
    auth: { type: 'token', token: COZE_CONFIG.token, onRefreshToken: async () => COZE_CONFIG.token },
    ui: {
      base: { layout: 'pc', zIndex: 80 },
      asstBtn: { isNeed: false },
      chatBot: { title: 'Chuồn Chuồn Garden Concierge', uploadable: false },
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

type IconName = 'arrow' | 'leaf' | 'bean' | 'flower' | 'clock' | 'pin' | 'menu' | 'close' | 'check' | 'chat' | 'phone' | 'mail';
type IconProps = SVGProps<SVGSVGElement> & { name: IconName };
function Icon({ name, ...props }: IconProps) {
  const artwork: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 19 19 5M5 5h14v14" /></>,
    leaf: <><path d="M5 19C-1 7 12 3 21 3c0 10-4 18-13 15M4 21 16 9" /><path d="m9 16 0-6m0 6 6 0" /></>,
    bean: <><ellipse cx="12" cy="12" rx="7.5" ry="10" transform="rotate(35 12 12)" /><path d="M17 4c-9 3-1 12-10 16" /></>,
    flower: <><path d="M12 8c-7-11-12 2-5 4-10 5 1 14 5 4 5 10 15 0 5-4 7-3 0-15-5-4Z" /><circle cx="12" cy="12" r="2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    chat: <><path d="M20 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 0 1-1-4 8 8 0 0 1 9-8" /><path d="M12 12c-1-6 4-8 9-8 0 5-2 9-7 8m-3 3 7-8" /></>,
    phone: <><path d="m8 3 3 5-3 3c1 2 3 4 5 5l3-3 5 3c0 3-2 5-4 5C10 21 3 14 3 7c0-2 2-4 5-4Z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{artwork[name]}</svg>;
}

function DragonflyMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M40 25v35m0-31C13-3-7 23 40 35m0-6C67-3 87 23 40 35m0 0C5 16 12 55 40 38m0-3c35-19 28 20 0 3" />
    <circle cx="40" cy="22" r="3" /><path d="M39 63c5-5 9-7 16-8m-7 5c-2-7 1-12 8-14 2 7-1 12-8 14" />
  </svg>;
}
function LeafSprig(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 180 260" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M30 249C88 197 85 109 144 14M64 208C14 210 2 171 7 150c35 7 54 25 57 58Zm15-42c43 3 66-22 69-53-34 5-57 19-69 53Zm14-47C54 112 42 83 49 56c28 12 43 30 44 63Zm25-61c26 2 47-16 54-40-25 0-44 15-54 40Z" />
    <path d="m64 208-41-39m56-3 50-37m-36-10L63 76m55-18 37-26" />
  </svg>;
}

const photo = (id: string, width = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=85`;
// Fixed Unsplash photographs; these are illustrative, not verified branch photos.
const MEDIA = {
  garden: photo('1554118811-1e0d58224f24', 1400),
  coffee: photo('1442512595331-e89e73853f31'),
  latte: photo('1541167760496-1628856ab772'),
  iced: photo('1517701604599-bb29b565090c'),
  matcha: photo('1515823064-d6e0c04616a7'),
  tea: photo('1564890369478-c89ca6d9cde9'),
  fruitTea: photo('1576092768241-dec231879fc3'),
  cake: photo('1533134242443-d4fd215305ad'),
  tart: photo('1519915028121-7d3463d20b13'),
  pastry: photo('1555507036-ab1f4038808a'),
};

type MenuCategory = 'Signature' | 'Cà phê' | 'Trà & Thảo mộc' | 'Bánh';
type MenuFilter = MenuCategory | 'Tất cả';
type MenuItem = { id: number; name: string; category: MenuCategory; description: string; price: string; image: string; alt: string; badge?: string };
const CATEGORIES: MenuFilter[] = ['Signature', 'Cà phê', 'Trà & Thảo mộc', 'Bánh', 'Tất cả'];
const MENU: MenuItem[] = [
  { id: 1, name: 'Chuồn Chuồn Cloud', category: 'Signature', description: 'Espresso, kem sữa hạt, mật hoa và lớp bọt muối biển.', price: '79.000đ', image: MEDIA.iced, alt: 'Cà phê sữa đá trong ly thủy tinh, các lớp cà phê hòa vào sữa.', badge: 'Được yêu thích' },
  { id: 2, name: 'Matcha Vườn Sớm', category: 'Signature', description: 'Matcha, sữa yến mạch và chút vanilla tự nhiên.', price: '82.000đ', image: MEDIA.matcha, alt: 'Tách matcha xanh với họa tiết lá tạo từ bọt sữa.', badge: 'Garden signature' },
  { id: 3, name: 'Cold Brew Cam Mật', category: 'Signature', description: 'Cà phê ủ lạnh 18 giờ, cam vàng và mật ong hoa.', price: '76.000đ', image: MEDIA.iced, alt: 'Ly cà phê đá trên bàn gỗ, ảnh minh họa cho dòng cà phê lạnh.', badge: 'Ủ chậm 18 giờ' },
  { id: 4, name: 'Arabica Đà Lạt', category: 'Cà phê', description: 'Pour-over rang vừa, hương hoa, citrus và caramel.', price: '72.000đ', image: MEDIA.coffee, alt: 'Nước nóng được rót qua phễu lọc cà phê thủ công.' },
  { id: 5, name: 'Botanical Latte', category: 'Cà phê', description: 'Espresso, sữa tươi và syrup thảo mộc nhà làm.', price: '75.000đ', image: MEDIA.latte, alt: 'Barista rót sữa tạo hình trên tách latte.', badge: "Barista’s pick" },
  { id: 6, name: 'Coconut Garden', category: 'Cà phê', description: 'Espresso, dừa non và lớp kem dừa mềm mịn.', price: '78.000đ', image: MEDIA.iced, alt: 'Ly cà phê đá với lớp sữa trắng hòa vào espresso.' },
  { id: 7, name: 'Trà Hoa Cúc & Lê', category: 'Trà & Thảo mộc', description: 'Cúc vàng, lê tươi và vị ngọt dịu của mật ong.', price: '72.000đ', image: MEDIA.tea, alt: 'Tách trà thảo mộc, gợi cảm giác ấm áp và thư giãn.', badge: 'Theo mùa' },
  { id: 8, name: 'Hibiscus Dâu Tằm', category: 'Trà & Thảo mộc', description: 'Atiso đỏ, dâu tằm và lát cam vàng thơm nhẹ.', price: '74.000đ', image: MEDIA.fruitTea, alt: 'Trà đang được ngâm trong tách thủy tinh trong suốt.' },
  { id: 9, name: 'Oolong Mộc Hoa', category: 'Trà & Thảo mộc', description: 'Oolong, quế hoa và đào trắng thanh mát.', price: '76.000đ', image: MEDIA.tea, alt: 'Trà được bày trong tách, minh họa cho dòng trà hoa.' },
  { id: 10, name: 'Tart Chanh Thảo Mộc', category: 'Bánh', description: 'Lemon curd, thyme và đế bánh hạnh nhân giòn.', price: '68.000đ', image: MEDIA.tart, alt: 'Bánh ngọt thủ công dùng kèm cà phê hoặc trà.' },
  { id: 11, name: 'Basque Matcha', category: 'Bánh', description: 'Cheesecake nướng mềm, thêm vị matcha dịu nhẹ.', price: '72.000đ', image: MEDIA.cake, alt: 'Bánh cheesecake phủ trái cây, ảnh minh họa cho bánh thủ công.', badge: 'Mẻ bánh mới' },
  { id: 12, name: 'Croissant Hạnh Nhân', category: 'Bánh', description: 'Bơ lên men và nhân kem hạnh nhân thơm bùi.', price: '62.000đ', image: MEDIA.pastry, alt: 'Bánh croissant vàng nhiều lớp đang được rắc đường.' },
];
const NAV = [
  { href: '#story', text: 'Câu chuyện' }, { href: '#garden', text: 'Không gian' },
  { href: '#menu', text: 'Thực đơn' }, { href: '#reservation', text: 'Đặt bàn' },
  { href: '#contact', text: 'Liên hệ' },
];
const LOCATIONS = [
  { city: 'Đà Lạt', name: 'Chuồn Chuồn Đà Lạt', address: '12 Trần Hưng Đạo, Phường 10, Đà Lạt', hours: '07:00 — 22:30', note: 'Một chút sương, một chút nắng.', number: '01' },
  { city: 'TP. Hồ Chí Minh', name: 'Chuồn Chuồn Sài Gòn', address: '28 Nguyễn Văn Hưởng, Thảo Điền, TP. Hồ Chí Minh', hours: '07:00 — 23:00', note: 'Một khoảng xanh giữa phố.', number: '02' },
];
const PRIMARY = 'group inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-[#315C4A] px-6 py-3.5 text-sm font-medium text-white transition duration-300 hover:bg-[#21493B] hover:shadow-lg active:scale-[0.98]';
const SECONDARY = 'group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#C8D9C9] px-6 py-3.5 text-sm font-medium text-[#315C4A] transition duration-300 hover:bg-[#E5EEE5] active:scale-[0.98]';
const INPUT = 'mt-2 min-h-12 w-full rounded-xl border border-[#D4E2D7] bg-white/85 px-4 py-3 text-base text-[#203129] outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 aria-[invalid=true]:border-[#A54C3B]';

function Brand({ compact = false }: { compact?: boolean }) {
  return <a href="#top" aria-label="Chuồn Chuồn — về đầu trang" className="inline-flex shrink-0 items-center gap-2.5 text-[#315C4A]">
    <DragonflyMark className={compact ? 'h-12 w-12' : 'h-14 w-14'} />
    <span><span className="block text-[15px] font-semibold tracking-[0.13em]">CHUỒN CHUỒN</span><span className="mt-0.5 block text-[10px] tracking-[0.15em] text-[#69766F]">BOTANICAL COFFEE & TEA</span></span>
  </a>;
}
function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${light ? 'text-white/90' : 'text-[#526F5E]'}`}><span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />{children}</p>;
}
function Photo({ src, alt, className = '', eager = false, sizes = '(min-width: 1024px) 45vw, 100vw' }: { src: string; alt: string; className?: string; eager?: boolean; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={`relative overflow-hidden bg-[#E5EEE5] ${className}`}>
    {failed ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center text-sm text-[#315C4A]" role="img" aria-label={alt}><Icon name="leaf" className="h-10 w-10" /><span>Khoảnh khắc trong khu vườn</span><span className="text-xs">Ảnh tạm thời chưa tải được</span></div> :
      <img src={src} srcSet={`${src.replace(/w=\d+/, 'w=480')} 480w, ${src.replace(/w=\d+/, 'w=900')} 900w, ${src.replace(/w=\d+/, 'w=1400')} 1400w`} sizes={sizes} alt={alt} width={1200} height={1500} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />}
  </div>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    navRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setOpen(false);
    };
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', onResize);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', onResize); };
  }, [open]);
  return <header ref={headerRef} className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${scrolled || open ? 'border-[#D4E2D7]/70 bg-[#FFFDFC]/95 shadow-sm' : 'border-white/60 bg-[#FAF8F5]/80'}`}>
    <div className="mx-auto flex h-[84px] max-w-[1360px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
      <Brand compact />
      <nav aria-label="Điều hướng chính" className="hidden items-center gap-7 lg:flex">
        {NAV.map((link) => <a key={link.href} href={link.href} className="cc-nav py-3 text-sm text-[#435B4D]">{link.text}</a>)}
      </nav>
      <a href="#reservation" className={`${PRIMARY} hidden px-5 sm:inline-flex`}>Đặt bàn <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
      <button ref={toggleRef} type="button" aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4E2D7] text-[#315C4A] lg:hidden"><Icon name={open ? 'close' : 'menu'} className="h-5 w-5" /></button>
    </div>
    <div className={`grid transition-[grid-template-rows,visibility] duration-300 lg:hidden ${open ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]'}`}>
      <div className="overflow-hidden"><nav ref={navRef} id="mobile-navigation" aria-label="Điều hướng trên điện thoại" className="mx-auto flex max-w-[1360px] flex-col px-6 pb-6">
        {NAV.map((link, index) => <a key={link.href} href={link.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className="flex items-center justify-between border-t border-[#D4E2D7]/70 py-4 text-lg"><span>{link.text}</span><span className="text-xs text-[#69766F]">0{index + 1}</span></a>)}
        <p className="mt-4 text-xs tracking-wide text-[#69766F]">Một khoảng thở xanh, mỗi ngày.</p>
      </nav></div>
    </div>
  </header>;
}

function Hero() {
  return <section aria-labelledby="hero-title" className="relative isolate overflow-hidden pt-32 pb-12 sm:pt-36 lg:pt-40 lg:pb-20">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 82% 44%, rgba(200,217,201,.45), transparent 52%)' }} />
    <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.08fr_1fr] lg:gap-6 lg:px-10">
      <div className="relative z-10 max-w-[660px] pt-2 lg:pb-12">
        <Eyebrow>Botanical Coffee · Đà Lạt × Sài Gòn</Eyebrow>
        <h1 id="hero-title" className="mt-7 text-[clamp(2.7rem,5.65vw,5.4rem)] font-medium leading-[1.12] tracking-[-0.05em] text-[#203129]">Chậm một nhịp.<br /><span className="text-[#315C4A]">Chạm một<br className="hidden lg:block" /> khoảng xanh.</span></h1>
        <p className="mt-7 max-w-[430px] text-base leading-7 text-[#69766F]">Cà phê rang mộc, trà hoa và những khoảng thở xanh được vun trồng cho những ngày bạn muốn sống chậm hơn một chút.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
          <a href="#menu" className={PRIMARY}>Khám phá thực đơn <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
          <a href="#garden" className={SECONDARY}>Ghé khu vườn <Icon name="leaf" className="h-4 w-4" /></a>
        </div>
        <dl className="mt-12 grid max-w-[460px] grid-cols-3 divide-x divide-[#D4E2D7] sm:mt-14">
          {[['100%', 'Hạt rang mộc'], ['18H', 'Cold brew chậm'], ['200+', 'Mảng xanh tự nhiên']].map(([value, label], index) => <div key={label} className={index ? 'pl-4 sm:pl-6' : 'pr-3'}><dt className="text-2xl font-medium tracking-[-0.035em] text-[#315C4A] sm:text-3xl">{value}</dt><dd className="mt-2 text-[11px] leading-5 text-[#69766F] sm:text-xs">{label}</dd></div>)}
        </dl>
      </div>
      <div className="relative mx-auto w-full max-w-[610px] pb-12 pl-7 pr-3 pt-3 sm:pl-14 lg:pb-14 lg:pl-10">
        <div aria-hidden="true" className="absolute bottom-5 left-12 right-0 top-12 rounded-tl-[150px] rounded-br-[110px] border border-[#C8D9C9]" />
        <div className="group relative h-[390px] overflow-hidden rounded-tl-[100px] rounded-tr-[32px] rounded-br-[100px] rounded-bl-[32px] sm:h-[540px] lg:h-[590px]">
          <Photo src={MEDIA.garden} alt="Không gian café sáng với cây xanh, bàn gỗ và những chiếc ghế mây." eager className="h-full" />
          <span className="absolute right-5 top-7 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#315C4A] backdrop-blur-md">Rooted in nature</span>
        </div>
        <div className="group absolute -left-1 bottom-1 w-[43%] rotate-[-5deg] rounded-[28px] border-[6px] border-[#FFFDFC] bg-[#FFFDFC] shadow-[0_15px_45px_rgba(33,73,59,0.12)] sm:bottom-0 sm:left-0 sm:w-[42%]">
          <Photo src={MEDIA.iced} alt="Cà phê sữa đá trong ly thủy tinh, đặt trên bàn gỗ." className="aspect-[4/5] rounded-[22px]" sizes="(min-width: 1024px) 220px, 40vw" />
          <span className="block py-3 text-center text-[10px] tracking-[0.19em] text-[#526F5E]">SLOWLY BREWED, FOR YOU</span>
        </div>
        <div className="absolute bottom-16 right-0 max-w-[220px] rounded-2xl border border-white/80 bg-white/85 px-4 py-4 shadow-[0_12px_40px_rgba(33,73,59,0.07)] backdrop-blur-xl sm:bottom-20 sm:px-6">
          <p className="text-[14px] font-medium text-[#315C4A]">A little green escape</p><p className="mt-2 flex items-center gap-2 text-[10px] text-[#69766F]"><Icon name="clock" className="h-3.5 w-3.5" />Every day · 07:00–22:30</p>
        </div>
        <LeafSprig className="pointer-events-none absolute -right-5 -top-9 h-36 w-28 rotate-[25deg] text-[#6E8C75]/75 sm:-right-8 sm:h-48 sm:w-36" />
        <DragonflyMark className="cc-float pointer-events-none absolute -left-5 top-4 h-20 w-20 rotate-[-18deg] text-[#6E8C75] sm:top-12" />
      </div>
    </div>
    <div className="mx-auto mt-10 flex max-w-[1280px] items-center gap-5 px-5 sm:px-8 lg:mt-8"><span className="text-[10px] uppercase tracking-[0.22em] text-[#69766F]">A slower kind of everyday</span><span className="h-px flex-1 bg-[#D4E2D7]" /><span className="text-[11px] text-[#69766F]">01 / The green escape</span></div>
  </section>;
}

function Story() {
  return <section id="story" aria-labelledby="story-title" className="relative overflow-hidden px-6 py-20 md:py-28">
    <LeafSprig className="pointer-events-none absolute -left-12 top-8 hidden h-72 w-52 rotate-[36deg] text-[#C8D9C9]/70 lg:block" />
    <div className="mx-auto max-w-[870px] text-center">
      <DragonflyMark className="mx-auto mb-6 h-16 w-16 text-[#7B977F]" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#69766F]">Câu chuyện của khu vườn</p>
      <h2 id="story-title" className="mt-6 text-[clamp(1.8rem,3.2vw,3rem)] font-normal leading-[1.35] tracking-[-0.035em] text-[#315C4A]">“Không chỉ là một ly cà phê.<br />Là một khoảng nhỏ để trở về<br className="hidden sm:block" /> với nhịp của chính mình.”</h2>
      <p className="mx-auto mt-7 max-w-[575px] text-base leading-7 text-[#69766F]">Chuồn Chuồn bắt đầu từ những điều giản dị: một hạt cà phê ngon, một nhành thảo mộc thơm và một chỗ ngồi có nắng. Chúng mình chăm chút từng điều nhỏ, để bạn chỉ cần đến và thong thả.</p>
      <span className="mx-auto mt-9 block h-10 w-px bg-[#B38A58]/60" aria-hidden="true" />
    </div>
  </section>;
}

function Garden() {
  const features: { icon: IconName; title: string; text: string; detail: string }[] = [
    { icon: 'leaf', title: 'Khoảng vườn để thở', text: 'Cây xanh, nắng tự nhiên và những góc ngồi yên tĩnh. Một nơi để đọc vài trang sách, hoặc chẳng cần làm gì.', detail: 'Nắng ghé qua. Bạn ở lại.' },
    { icon: 'bean', title: 'Hạt cà phê rang mộc', text: 'Hạt được chọn lọc và rang vừa, giữ vị ngọt cùng cá tính tự nhiên. Pha chậm để từng tầng hương có thời gian mở ra.', detail: 'Nguyên bản từ hạt.' },
    { icon: 'flower', title: 'Thảo mộc theo mùa', text: 'Trà hoa, trái cây và thảo mộc được phối nhẹ theo mùa. Hương thơm vừa đủ, vị thanh để nhâm nhi lâu hơn.', detail: 'Mỗi mùa, một chút mới.' },
  ];
  return <section id="garden" aria-labelledby="garden-title" className="bg-[#F1F6F0] py-20 md:py-28">
    <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div><Eyebrow>Những điều chúng mình gìn giữ</Eyebrow><h2 id="garden-title" className="mt-5 max-w-[640px] text-4xl font-medium leading-[1.2] tracking-[-0.04em] text-[#21493B] md:text-5xl">Từ khu vườn<br />đến từng ngụm nhỏ.</h2></div>
        <p className="max-w-[310px] text-base leading-7 text-[#69766F]">Không vội vàng. Không cầu kỳ.<br />Chỉ là những điều tốt lành, được làm bằng sự chăm chút.</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3 md:items-start">
        {features.map((item, i) => <article key={item.title} className={`group relative overflow-hidden border border-[#D4E2D7]/70 p-7 transition duration-500 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(33,73,59,0.07)] lg:p-9 ${i === 1 ? 'rounded-tl-[48px] rounded-tr-[24px] rounded-br-[48px] rounded-bl-[24px] bg-[#E5EEE5]/70 md:mt-10' : 'rounded-[24px] bg-white/65'}`}>
          <div className="flex items-start justify-between"><Icon name={item.icon} className="h-10 w-10 text-[#526F5E]" /><span className="text-4xl font-light tracking-[-0.04em] text-[#9EB5A2]">0{i + 1}</span></div>
          <h3 className="mt-9 text-xl font-medium tracking-[-0.025em] text-[#21493B]">{item.title}</h3><p className="mt-4 text-[15px] leading-7 text-[#69766F]">{item.text}</p>
          <p className="mt-8 border-t border-[#C8D9C9]/70 pt-5 text-xs tracking-wide text-[#526F5E]">{item.detail}</p>
        </article>)}
      </div>
      <div className="mt-20 grid gap-5 md:grid-cols-[1.12fr_.88fr] md:gap-6">
        <figure className="group relative min-h-[430px] md:row-span-2">
          <div className="absolute inset-0"><Photo src={MEDIA.garden} alt="Café với bàn ghế mây, cây cảnh và ánh sáng tự nhiên." className="h-full rounded-tl-[65px] rounded-tr-[28px] rounded-br-[28px] rounded-bl-[28px]" /></div>
          <figcaption className="absolute bottom-6 left-5 right-5 rounded-[24px] border border-white/80 bg-white/85 p-6 text-[#315C4A] backdrop-blur-xl sm:left-7 sm:right-auto sm:min-w-[290px]"><span className="text-[10px] uppercase tracking-[0.2em]">The art of taking it slow</span><p className="mt-3 text-3xl leading-tight tracking-[-0.035em]">Grown slowly.<br />Brewed thoughtfully.</p></figcaption>
        </figure>
        <figure className="group relative"><Photo src={MEDIA.coffee} alt="Pha cà phê pour-over bằng ấm cổ ngỗng và phễu lọc." className="h-[240px] rounded-[28px] md:h-[280px]" /><figcaption className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-xs text-[#315C4A]">Một chút tỉ mỉ trong từng lần pha.</figcaption></figure>
        <div className="grid grid-cols-2 gap-5 md:gap-6">
          <figure className="group"><Photo src={MEDIA.tea} alt="Tách trà thảo mộc cho một buổi chiều chậm rãi." className="h-[210px] rounded-[24px] md:h-[240px]" /><figcaption className="mt-3 text-[11px] tracking-wide text-[#69766F]">Hoa thơm, trà ấm.</figcaption></figure>
          <figure className="group pt-8"><Photo src={MEDIA.pastry} alt="Bánh croissant nhiều lớp vàng giòn, phủ đường mịn." className="h-[210px] rounded-[24px] md:h-[240px]" /><figcaption className="mt-3 text-[11px] tracking-wide text-[#69766F]">Thêm một chút ngọt.</figcaption></figure>
        </div>
      </div>
    </div>
  </section>;
}

function MenuSection() {
  const [active, setActive] = useState<MenuFilter>('Signature');
  const items = active === 'Tất cả' ? MENU : MENU.filter((item) => item.category === active);
  return <section id="menu" aria-labelledby="menu-title" className="py-20 md:py-28">
    <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div><Eyebrow>From our garden, with love</Eyebrow><h2 id="menu-title" className="mt-5 text-4xl font-medium leading-[1.2] tracking-[-0.04em] text-[#21493B] md:text-5xl">Một chút để nhâm nhi.</h2><p className="mt-5 max-w-[540px] text-base leading-7 text-[#69766F]">Từ những hạt cà phê quen thuộc đến trà hoa được phối nhẹ theo mùa.</p></div>
        <p className="flex shrink-0 items-center gap-2 text-xs text-[#526F5E]"><Icon name="leaf" className="h-4 w-4" />Được pha khi bạn gọi.</p>
      </div>
      <div role="group" aria-label="Lọc thực đơn theo danh mục" className="mt-10 flex gap-2 overflow-x-auto pb-3">
        {CATEGORIES.map((category) => <button key={category} type="button" aria-pressed={active === category} aria-controls="menu-results" onClick={() => setActive(category)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition duration-300 ${active === category ? 'border-[#315C4A] bg-[#315C4A] text-white' : 'border-[#D4E2D7] bg-[#FFFDFC] text-[#315C4A] hover:border-[#87A58E] hover:bg-[#F1F6F0]'}`}>{active === category && <Icon name="check" className="h-3.5 w-3.5" />}{category}</button>)}
      </div>
      <p role="status" className="sr-only">{items.length} món trong danh mục {active}.</p>
      <div id="menu-results" className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => <article key={item.id} className="cc-appear group rounded-[28px] bg-[#FFFDFC] p-3 pb-6 transition duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(33,73,59,0.07)]">
          <div className="relative"><Photo src={item.image} alt={item.alt} className="aspect-[5/4] rounded-[22px]" sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw" />{item.badge && <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-[#FFFDFC]/90 px-3 py-1.5 text-[10px] font-medium tracking-wide text-[#315C4A] backdrop-blur-sm">{item.badge}</span>}</div>
          <div className="px-3 pt-5"><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#69766F]">{item.category}</p><h3 className="mt-2 text-[22px] font-medium leading-snug tracking-[-0.025em] text-[#21493B]">{item.name}</h3><p className="mt-3 min-h-[52px] text-sm leading-[1.8] text-[#69766F]">{item.description}</p><div className="mt-5 flex items-center justify-between border-t border-[#E9E2D9]/70 pt-4"><span className="text-lg font-medium tracking-[-0.02em] text-[#315C4A]">{item.price}</span><Icon name={item.category === 'Bánh' ? 'flower' : item.category === 'Cà phê' ? 'bean' : 'leaf'} className="h-5 w-5 text-[#87A58E]" /></div></div>
        </article>)}
      </div>
      <p className="mt-8 text-center text-xs leading-6 text-[#69766F]">Thực đơn và giá minh họa · Ảnh gợi ý phong cách, không phải ảnh chính xác của từng món.</p>
    </div>
  </section>;
}

type ReservationValues = { name: string; contact: string; branch: string };
type ReservationErrors = Partial<Record<'name' | 'contact', string>>;
function Reservation() {
  const [values, setValues] = useState<ReservationValues>({ name: '', contact: '', branch: 'Đà Lạt' });
  const [errors, setErrors] = useState<ReservationErrors>({});
  const [success, setSuccess] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (success) successRef.current?.focus(); }, [success]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: ReservationErrors = {};
    const name = values.name.trim();
    const contact = values.contact.trim();
    const phone = contact.replace(/[\s().-]/g, '');
    if (!name) nextErrors.name = 'Bạn cho chúng mình biết tên nhé.';
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const validPhone = /^(?:0[35789]\d{8}|\+?84[35789]\d{8})$/.test(phone);
    if (!contact) nextErrors.contact = 'Vui lòng nhập số điện thoại hoặc email.';
    else if (!validEmail && !validPhone) nextErrors.contact = 'Nhập email hợp lệ hoặc số di động Việt Nam (ví dụ: 0912 345 678).';
    setErrors(nextErrors);
    if (nextErrors.name) { nameRef.current?.focus(); return; }
    if (nextErrors.contact) { contactRef.current?.focus(); return; }
    // Front-end demonstration only: no network request or storage of personal data.
    setSuccess(true);
    setValues({ name: '', contact: '', branch: values.branch });
  }
  function update(field: keyof ReservationValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (field === 'name' || field === 'contact') setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return <section id="reservation" aria-labelledby="reservation-title" className="relative px-5 pb-20 pt-3 sm:px-8 md:pb-28">
    <div className="relative isolate mx-auto max-w-[1216px] overflow-hidden rounded-[36px] bg-[#E5EEE5] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.13]" aria-hidden="true"><Photo src={MEDIA.garden} alt="" className="h-full" /></div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#E5EEE5] via-[#E5EEE5]/80 to-transparent" />
      <LeafSprig className="pointer-events-none absolute -bottom-12 -left-8 h-64 w-48 rotate-[18deg] text-[#87A58E]/40" />
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
        <div><Eyebrow>Your table in the garden</Eyebrow><h2 id="reservation-title" className="mt-6 text-4xl font-medium leading-[1.2] tracking-[-0.04em] text-[#21493B] sm:text-5xl">Dành một chỗ<br />cho buổi chiều<br />thật chậm.</h2><p className="mt-6 max-w-[370px] text-base leading-7 text-[#526F5E]">Để lại thông tin, Chuồn Chuồn sẽ liên hệ xác nhận bàn và gợi ý góc ngồi phù hợp.</p><p className="mt-7 flex items-center gap-2 text-xs text-[#526F5E]"><Icon name="leaf" className="h-4 w-4" />Một góc vườn đang chờ bạn.</p></div>
        <div className="relative rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-[0_20px_60px_rgba(33,73,59,0.06)] backdrop-blur-xl sm:p-8">
          {success ? <div ref={successRef} tabIndex={-1} className="cc-appear flex min-h-[350px] flex-col items-center justify-center text-center" role="status">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E5EEE5] text-[#315C4A]"><Icon name="check" className="h-7 w-7" /></span>
            <h3 className="mt-6 text-2xl font-medium tracking-[-0.025em] text-[#21493B]">Cảm ơn bạn.</h3><p className="mt-3 text-base leading-7 text-[#526F5E]">Chuồn Chuồn sẽ sớm gửi lời xác nhận.</p>
            <p className="mt-5 rounded-xl border border-[#D4E2D7] bg-[#F1F6F0] p-4 text-xs leading-6 text-[#526F5E]">Đây là xác nhận minh họa. Thông tin chưa được gửi đến quán và chưa có bàn nào được đặt.</p>
            <button type="button" onClick={() => { setSuccess(false); requestAnimationFrame(() => nameRef.current?.focus()); }} className={`${SECONDARY} mt-6`}>Trở lại biểu mẫu <Icon name="arrow" className="h-4 w-4" /></button>
          </div> : <form onSubmit={submit} noValidate aria-label="Đặt bàn minh họa" aria-describedby="reservation-demo" className="space-y-5">
            <div><label htmlFor="reservation-name" className="text-sm font-medium text-[#315C4A]">Họ và tên <span aria-hidden="true">*</span></label><input ref={nameRef} id="reservation-name" name="name" autoComplete="name" required maxLength={100} value={values.name} onChange={(event) => update('name', event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} className={INPUT} placeholder="Tên bạn là…" />{errors.name && <p id="name-error" className="mt-2 text-xs leading-5 text-[#A54C3B]">{errors.name}</p>}</div>
            <div><label htmlFor="reservation-contact" className="text-sm font-medium text-[#315C4A]">Số điện thoại hoặc email <span aria-hidden="true">*</span></label><input ref={contactRef} id="reservation-contact" name="contact" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={254} value={values.contact} onChange={(event) => update('contact', event.target.value)} aria-invalid={!!errors.contact} aria-describedby={errors.contact ? 'contact-error' : undefined} className={INPUT} placeholder="Để chúng mình liên hệ với bạn" />{errors.contact && <p id="contact-error" className="mt-2 text-xs leading-5 text-[#A54C3B]">{errors.contact}</p>}</div>
            <div><label htmlFor="reservation-branch" className="text-sm font-medium text-[#315C4A]">Chi nhánh</label><select id="reservation-branch" name="branch" value={values.branch} onChange={(event) => update('branch', event.target.value)} className={INPUT}><option>Đà Lạt</option><option>TP. Hồ Chí Minh</option></select></div>
            <button type="submit" className={`${PRIMARY} w-full`}>Giữ chỗ cho tôi <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button>
            <p id="reservation-demo" className="text-center text-[11px] leading-5 text-[#69766F]">Biểu mẫu trải nghiệm · Thông tin chỉ được kiểm tra trên trang, chưa gửi đến quán.</p>
          </form>}
        </div>
      </div>
    </div>
  </section>;
}

function Locations({ notify }: { notify: (message: string) => void }) {
  return <section aria-labelledby="locations-title" className="mx-auto max-w-[1280px] px-5 pb-20 sm:px-8 md:pb-28">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Eyebrow>Find your little escape</Eyebrow><h2 id="locations-title" className="mt-5 text-3xl font-medium tracking-[-0.035em] text-[#21493B] md:text-4xl">Hẹn bạn ở khu vườn.</h2></div><p className="text-xs text-[#69766F]">Hai thành phố. Cùng một nhịp chậm.</p></div>
    <div className="mt-9 grid gap-6 md:grid-cols-2">
      {LOCATIONS.map((location) => <article key={location.city} className="group relative rounded-[24px] border border-[#D4E2D7] bg-[#FFFDFC] p-7 transition duration-300 hover:border-[#87A58E] sm:p-8">
        <span aria-hidden="true" className="absolute right-7 top-6 text-5xl font-light tracking-[-0.04em] text-[#E5EEE5]">{location.number}</span>
        <Icon name="pin" className="h-7 w-7 text-[#526F5E]" /><p className="mt-5 text-xs text-[#69766F]">{location.note}</p><h3 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-[#21493B]">{location.name}</h3><address className="mt-4 max-w-[350px] text-sm not-italic leading-6 text-[#69766F]">{location.address}</address><p className="mt-3 flex items-center gap-2 text-sm text-[#526F5E]"><Icon name="clock" className="h-4 w-4" />{location.hours}</p>
        <button type="button" onClick={() => notify(`Địa điểm ${location.city} là nội dung demo. Chỉ đường sẽ được bổ sung khi địa chỉ được xác minh.`)} className="mt-6 inline-flex min-h-11 items-center gap-3 border-b border-[#87A58E] text-sm font-medium text-[#315C4A] transition hover:gap-5">Xem chỉ đường <Icon name="arrow" className="h-4 w-4" /></button>
      </article>)}
    </div><p className="mt-5 text-xs leading-6 text-[#69766F]">Địa điểm và giờ mở cửa là nội dung demo, chưa được xác minh.</p>
  </section>;
}

function Footer({ notify }: { notify: (message: string) => void }) {
  const demoContact = () => notify('Thông tin liên hệ là nội dung demo. Các kênh chính thức sẽ được cập nhật khi website đi vào hoạt động.');
  return <footer id="contact" className="bg-[#EEF4EF] px-5 pt-16 pb-28 sm:px-8 sm:pb-12">
    <div className="mx-auto max-w-[1216px]">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_1fr_1fr] lg:gap-12">
        <div><Brand /><p className="mt-5 max-w-[270px] text-sm leading-7 text-[#69766F]">Một khoảng thở xanh giữa thành phố.<br />Cà phê ngon. Trà thơm. Và bạn.</p><LeafSprig className="mt-5 h-20 w-16 rotate-[45deg] text-[#87A58E]" /></div>
        <div><h3 className="text-sm font-semibold text-[#315C4A]">Khám phá</h3><nav aria-label="Điều hướng cuối trang" className="mt-5 flex flex-col items-start gap-3">{NAV.slice(0, 4).map((link) => <a key={link.href} href={link.href} className="text-sm leading-6 text-[#69766F] transition hover:text-[#21493B] hover:underline hover:underline-offset-4">{link.text}</a>)}</nav></div>
        <div><h3 className="text-sm font-semibold text-[#315C4A]">Giờ mở cửa</h3><p className="mt-5 text-sm leading-7 text-[#69766F]">Thứ Hai — Chủ Nhật<br /><span className="text-[#315C4A]">07:00 — 22:30</span></p><p className="mt-3 text-xs leading-6 text-[#69766F]">Riêng Sài Gòn, đến 23:00.<br />Ngày nào cũng có chút xanh.</p></div>
        <div><h3 className="text-sm font-semibold text-[#315C4A]">Kết nối với Chuồn Chuồn</h3><div className="mt-4 flex flex-col items-start"><button type="button" onClick={demoContact} className="inline-flex min-h-11 items-center gap-2 text-sm text-[#526F5E] hover:underline"><Icon name="mail" className="h-4 w-4 shrink-0" />hello@chuonchuon.cafe</button><button type="button" onClick={demoContact} className="inline-flex min-h-11 items-center gap-2 text-sm text-[#526F5E] hover:underline"><Icon name="phone" className="h-4 w-4" />090 123 4567</button></div><div className="mt-3 flex gap-5">{['Instagram', 'Facebook'].map((label) => <button type="button" key={label} onClick={demoContact} className="min-h-11 text-xs text-[#315C4A] underline decoration-[#87A58E] underline-offset-4">{label}</button>)}</div><p className="mt-2 text-[11px] text-[#69766F]">Thông tin liên hệ minh họa.</p></div>
      </div>
      <div className="mt-10 flex flex-col gap-4 border-t border-[#D4E2D7] pt-7 text-[11px] text-[#69766F] sm:flex-row sm:items-center sm:justify-between sm:pr-16"><p>© 2026 Chuồn Chuồn Botanical Coffee & Tea.</p><p className="flex items-center gap-2">Made slowly, served warmly. <DragonflyMark className="h-7 w-7 text-[#526F5E]" /></p></div>
    </div>
  </footer>;
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
  return <div ref={containerRef} className="fixed bottom-5 right-5 z-[70] sm:bottom-6 sm:right-6" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
    {visible && <section id="garden-chat-panel" aria-labelledby="chat-title" className="cc-appear absolute bottom-[78px] right-0 w-[min(340px,calc(100vw-40px))] rounded-[24px] border border-[#D4E2D7] bg-[#FFFDFC] p-6 shadow-[0_16px_60px_rgba(33,73,59,0.15)]">
      <div className="flex items-start justify-between gap-3"><Icon name="chat" className="h-8 w-8 text-[#315C4A]" /><button ref={closeRef} type="button" aria-label="Đóng thông báo trợ lý" onClick={() => { setVisible(false); buttonRef.current?.focus(); }} className="-mr-2 -mt-2 flex h-10 w-10 items-center justify-center rounded-full text-[#69766F] hover:bg-[#F1F6F0]"><Icon name="close" className="h-5 w-5" /></button></div>
      <h2 id="chat-title" className="mt-4 text-lg font-medium text-[#21493B]">Hỏi Chuồn Chuồn</h2><p className="mt-3 text-sm leading-6 text-[#69766F]">{state === 'loading' ? 'Trợ lý đang kết nối. Bạn thử lại sau một chút nhé.' : state === 'unavailable' ? 'Trợ lý tạm thời chưa kết nối được. Bạn vẫn có thể xem thực đơn và ghé thăm khu vườn.' : 'Trợ lý khu vườn sẽ sớm được bật. Trong lúc chờ, mời bạn ghé xem thực đơn nhé.'}</p><a href="#menu" onClick={() => setVisible(false)} className="mt-5 inline-flex min-h-11 items-center gap-3 text-sm font-medium text-[#315C4A]">Khám phá thực đơn <Icon name="arrow" className="h-4 w-4" /></a>
    </section>}
    <div className="group relative"><span aria-hidden="true" className="pointer-events-none absolute right-[76px] top-3 hidden whitespace-nowrap rounded-full border border-[#D4E2D7] bg-[#FFFDFC] px-4 py-2 text-xs text-[#315C4A] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-within:opacity-100 sm:block">Hỏi Chuồn Chuồn</span><button ref={buttonRef} type="button" aria-label="Hỏi Chuồn Chuồn" aria-expanded={visible} aria-controls={visible ? 'garden-chat-panel' : undefined} onClick={() => { if (visible) setVisible(false); else if (!open()) setVisible(true); }} className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#315C4A] text-white shadow-[0_12px_35px_rgba(33,73,59,0.22)] ring-4 ring-[#E5EEE5]/80 transition duration-300 hover:scale-105 hover:bg-[#21493B] active:scale-95"><Icon name={visible ? 'close' : 'chat'} className="h-7 w-7" /></button></div>
  </div>;
}

export default function Page() {
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 9000);
    return () => clearTimeout(timer);
  }, [notice]);
  return <div id="top" lang="vi" className="cc-site min-h-screen bg-[#FAF8F5] text-[#203129] antialiased">
    <style jsx global>{`
      html { scroll-behavior: smooth; scroll-padding-top: 110px; }
      body { margin: 0; }
      .cc-site { font-family: "Segoe UI Variable", "Segoe UI", "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; color-scheme: light; }
      .cc-site *, .cc-site *::before, .cc-site *::after { box-sizing: border-box; }
      .cc-site section, .cc-site footer { scroll-margin-top: 24px; }
      .cc-site ::selection { background: #c8d9c9; color: #203129; }
      .cc-site button { cursor: pointer; }
      .cc-site :where(a, button, input, select, [tabindex]):focus-visible { outline: 2px solid #315c4a; outline-offset: 5px; }
      .cc-site img { display: block; }
      .cc-nav { position: relative; }
      .cc-nav::after { content: ''; position: absolute; bottom: 5px; left: 0; width: 100%; height: 1px; background: #87a58e; transform: scaleX(0); transform-origin: left; transition: transform .25s ease; }
      .cc-nav:hover::after, .cc-nav:focus-visible::after { transform: scaleX(1); }
      .cc-appear { animation: cc-appear .35s ease both; }
      .cc-float { animation: cc-float 8s ease-in-out infinite; }
      @keyframes cc-appear { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes cc-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -8px; } }
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto !important; }
        .cc-site *, .cc-site *::before, .cc-site *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
      }
      @media (forced-colors: active) { .cc-site button, .cc-site input, .cc-site select { border: 1px solid ButtonText; } }
    `}</style>
    <a href="#main-content" className="sr-only z-[100] rounded-full bg-[#315C4A] px-6 py-3 text-white focus:not-sr-only focus:fixed focus:left-5 focus:top-5">Đến nội dung chính</a>
    <Header />
    <main id="main-content" tabIndex={-1}>
      <Hero />
      <Story />
      <Garden />
      <MenuSection />
      <div aria-hidden="true" className="mx-auto flex max-w-[750px] items-center justify-center gap-5 px-8 pb-16 text-[#87A58E]"><span className="h-px flex-1 bg-[#D4E2D7]" /><LeafSprig className="h-16 w-12 rotate-[55deg]" /><span className="text-xs tracking-[0.17em] text-[#69766F]">stay awhile</span><DragonflyMark className="h-12 w-12" /><span className="h-px flex-1 bg-[#D4E2D7]" /></div>
      <Reservation />
      <Locations notify={setNotice} />
    </main>
    <Footer notify={setNotice} />
    <div role="status" aria-live="polite" aria-atomic="true">{notice && <div className="cc-appear fixed bottom-24 left-5 right-5 z-[75] mx-auto flex max-w-[520px] items-start gap-4 rounded-2xl border border-[#D4E2D7] bg-[#FFFDFC] p-5 text-sm leading-6 text-[#315C4A] shadow-[0_10px_40px_rgba(33,73,59,0.15)] sm:bottom-7"><Icon name="leaf" className="mt-1 h-5 w-5 shrink-0" /><p className="flex-1">{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="Đóng thông báo" className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[#F1F6F0]"><Icon name="close" className="h-4 w-4" /></button></div>}</div>
    <GardenChat />
  </div>;
}
