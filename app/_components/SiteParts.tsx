'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode, SVGProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PHOTO, MAP, PHONE, EMAIL, NAV, EXPERIENCES, QUESTIONS } from './content';

const COZE_SDK_URL = 'https://sf-cdn.coze.com/obj/unpkg-va/flow-platform/chat-app-sdk/1.2.0-beta.6/libs/oversea/index.js';

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

type CozeSession = { token: string; botId: string; userId: string };

async function fetchCozeSession(): Promise<CozeSession> {
  const response = await fetch('/api/coze/token', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Coze session unavailable');
  const session = await response.json() as Partial<CozeSession>;
  if (!session.token || !session.botId || !session.userId) throw new Error('Invalid Coze session');
  return session as CozeSession;
}

function createCozeOptions(session: CozeSession): Record<string, unknown> {
  return {
    config: {
      type: 'bot',
      bot_id: session.botId,
      isIframe: false,
    },
    auth: {
      type: 'token',
      token: session.token,
      onRefreshToken: async () => (await fetchCozeSession()).token,
    },
    userInfo: {
      id: session.userId,
      url: 'https://sf-coze-web-cdn.coze.com/obj/eden-sg/lm-lgvj/ljhwZthlaukjlkulzlp/coze/coze-logo.png',
      nickname: 'User',
    },
    ui: {
      base: {
        icon: '/images/chuon-chuon/dragonfly-icon.png',
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
    if (typeof window === 'undefined') return;
    let absoluteUrl: string;
    try {
      const url = new URL(COZE_SDK_URL);
      if (url.protocol !== 'https:') { setState('unavailable'); return; }
      absoluteUrl = url.href;
    } catch { setState('unavailable'); return; }

    let disposed = false;
    let initialized = false;
    let owned = false;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    setState('loading');
    let script = Array.from(document.scripts).find((node) => node.src === absoluteUrl);

    const onLoad = async () => {
      if (disposed || initialized) return;
      initialized = true;
      if (loadTimer) clearTimeout(loadTimer);
      if (script) script.dataset.chuonCozeLoaded = 'true';
      const Client = window.CozeWebSDK?.WebChatClient;
      if (!Client) { setState('unavailable'); return; }
      try {
        const session = await fetchCozeSession();
        if (disposed) return;
        clientRef.current = new Client(createCozeOptions(session));
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


function Wordmark({light=false}:{light?:boolean}){
 return <Link href="/" className={`wordmark ${light?'wordmark-light':''}`} aria-label="Chuồn Chuồn Coffee & Bistro - Về trang chủ"><span className="logo-source"><img src="/images/chuon-chuon/logo-coffee-bistro.png" width="60" height="60" alt="Logo Chuồn Chuồn Coffee & Bistro"/></span><span className="wordmark-text"><strong>Chuồn Chuồn</strong><small>COFFEE & BISTRO</small></span></Link>;
}
export function Header(){
 const [open,setOpen]=useState(false);const pathname=usePathname();const toggle=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setOpen(false);},[pathname]);
 useEffect(()=>{if(!open)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);toggle.current?.focus();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[open]);
 return <header className="site-header"><div className="header-inner"><Wordmark/><nav className="desktop-nav" aria-label="Điều hướng chính">{NAV.map(item=><Link href={item.href} key={item.href} aria-current={pathname===item.href?'page':undefined}>{item.label}</Link>)}</nav><a className="nav-map" href={MAP} target="_blank" rel="noopener noreferrer"><SymbolIcon name="pin" size={17}/>Chỉ đường<SymbolIcon name="arrow" size={16}/></a><button ref={toggle} className="mobile-toggle" type="button" aria-label={open?'Đóng menu':'Mở menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(v=>!v)}><SymbolIcon name={open?'close':'menu'} size={24}/></button></div>{open&&<nav id="mobile-navigation" className="mobile-nav" aria-label="Điều hướng di động">{NAV.map(item=><Link href={item.href} key={item.href} aria-current={pathname===item.href?'page':undefined} onClick={()=>setOpen(false)}>{item.label}<SymbolIcon name="arrow" size={18}/></Link>)}<a href={MAP} target="_blank" rel="noopener noreferrer">Mở Google Maps<SymbolIcon name="pin" size={18}/></a></nav>}</header>;
}
export function RouteMotion({children}:{children:ReactNode}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const reveal=Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});
  if(!media.matches){el.classList.add('motion-ready');reveal.forEach(item=>observer.observe(item));}
  const photos=Array.from(el.querySelectorAll<HTMLElement>('[data-parallax]'));let frame=0;
  const paint=()=>{frame=0;if(media.matches)return;photos.forEach(photo=>{const box=photo.getBoundingClientRect();if(box.bottom>0&&box.top<window.innerHeight){const p=(window.innerHeight*.5-(box.top+box.height*.5))/window.innerHeight;photo.style.setProperty('--drift',`${Math.max(-35,Math.min(35,p*55))}px`);}});};
  const tick=()=>{if(!frame)frame=requestAnimationFrame(paint);};
  const change=()=>{if(media.matches){el.classList.remove('motion-ready');photos.forEach(photo=>photo.style.removeProperty('--drift'));}};
  window.addEventListener('scroll',tick,{passive:true});media.addEventListener('change',change);tick();
  return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',tick);media.removeEventListener('change',change);};
 },[]);
 return <div className="route-motion" ref={root}>{children}</div>;
}
export function Intro(){
 return <section className="intro section-shell" id="gioi-thieu"><div className="intro-heading" data-reveal><span className="eyebrow">ĐIỂM DU LỊCH CHUỒN CHUỒN</span><h2>Thiên nhiên, trò chơi<br/>và những điểm dừng<br/><em>đáng khám phá.</em></h2></div><div className="intro-layout"><figure className="intro-tall" data-parallax><img src={PHOTO.family} alt="Gia đình đi dạo giữa vườn hoa trên đồi" loading="lazy"/><figcaption>Đường dạo trong khuôn viên</figcaption></figure><div className="intro-copy" data-reveal><p>Điểm Du Lịch Chuồn Chuồn kết hợp cảnh quan đồi, vườn hoa, khu check-in và hoạt động vui chơi ngoài trời. Gia đình, nhóm bạn và khách du lịch có thể chọn trải nghiệm phù hợp với chuyến đi của mình.</p><Link href="/trai-nghiem" className="text-link">Khám phá Chuồn Chuồn<SymbolIcon name="arrow" size={20}/></Link><figure className="intro-small" data-parallax><img src={PHOTO.mini} alt="Các tiểu cảnh nhà trên cây trong khuôn viên" loading="lazy"/><figcaption>Các góc check-in</figcaption></figure></div></div></section>;
}
export function HomeRoutes(){
 return <section className="home-routes section-shell" id="thong-tin"><div className="section-heading" data-reveal><span className="eyebrow">CHUẨN BỊ CHUYẾN ĐI</span><h2>Thông tin cần biết<br/><em>trước chuyến đi.</em></h2></div><div className="essential-grid"><Link href="/gia-ve" className="essential-card price-card" data-reveal><span>GIÁ VÉ THAM QUAN</span><strong>120.000<small>đ / người lớn</small></strong><p>Trẻ em 80.000đ. Dưới 1,0 m miễn phí.</p><b>Xem giá vé và quyền lợi<SymbolIcon name="arrow"/></b></Link><Link href="/len-ke-hoach" className="essential-card" data-reveal><span>GIỜ MỞ CỬA</span><strong>07:30 - 17:00</strong><p>Mở cửa hằng ngày, kể cả ngày lễ.</p><b>Chuẩn bị chuyến tham quan<SymbolIcon name="arrow"/></b></Link><Link href="/duong-di" className="essential-card" data-reveal><span>ĐỊA ĐIỂM</span><strong>Nam Ban<small>Lâm Đồng</small></strong><p>217 Thôn 5, Nam Ban, Lâm Đồng.</p><b>Xem đường đi<SymbolIcon name="arrow"/></b></Link><Link href="/khach-doan" className="essential-card group-card" data-reveal><span>KHÁCH ĐOÀN</span><h3>Lên kế hoạch<br/>cho đoàn của bạn.</h3><p>Trao đổi nhu cầu tham quan và ăn uống trước chuyến đi.</p><b>Liên hệ tư vấn đoàn<SymbolIcon name="arrow"/></b></Link></div></section>;
}
export function Momentum(){
 return <section className="momentum" data-parallax><img src={PHOTO.bridge} alt="Tháp và cầu tham quan giữa cảnh đồi tại Chuồn Chuồn" loading="lazy"/><div className="momentum-content" data-reveal><span className="eyebrow">HÌNH ẢNH CHUỒN CHUỒN</span><h2>Xem Chuồn Chuồn qua<br/><em>những hình ảnh thực tế.</em></h2><Link href="/trai-nghiem#bo-suu-tap" className="button button-light">Xem bộ ảnh<SymbolIcon name="arrow"/></Link></div></section>;
}
export function PageBanner({eyebrow,title,accent,image,alt,intro}:{eyebrow:string;title:string;accent:string;image:string;alt:string;intro:string}){
 return <section className="page-banner"><div className="page-banner-photo" data-parallax><img src={image} alt={alt} fetchPriority="high"/></div><div className="page-banner-content"><span className="eyebrow">{eyebrow}</span><h1>{title}<br/><em>{accent}</em></h1><p>{intro}</p></div><a className="banner-down" href="#chi-tiet" aria-label="Đến nội dung chi tiết"><SymbolIcon name="down" size={20}/></a></section>;
}
export function Experiences(){
 return <section className="experiences section-shell" id="chi-tiet"><div className="section-heading" data-reveal><span className="eyebrow">CÁC KHU TRẢI NGHIỆM</span><h2>Chọn trải nghiệm<br/><em>phù hợp với chuyến đi.</em></h2><p>Từ vườn hoa và vườn thú mini đến các hoạt động ngoài trời. Xem từng khu trước khi lên lịch tham quan.</p></div><div className="experience-grid">{EXPERIENCES.map(item=><article className={`experience-card ${item.poster?'experience-poster':''}`} id={item.id} key={item.id} data-reveal><div className="experience-image" data-parallax><img src={item.image} alt={item.alt} loading="lazy"/>{item.poster&&<span className="image-label">Ảnh truyền thông</span>}</div><div className="experience-info"><span className="eyebrow">{item.tag}</span><h3>{item.title}</h3><p>{item.desc}</p>{['sky-line','truot-phao'].includes(item.id)&&<Link href="/len-ke-hoach#luu-y" className="text-link">Điều kiện tham gia<SymbolIcon name="arrow" size={17}/></Link>}</div></article>)}</div><div className="experience-note"><p>Vé tham quan còn bao gồm xích đu ngắm cảnh. Tình trạng hoạt động phụ thuộc thời tiết và điều kiện vận hành trong ngày.</p><Link href="/gia-ve" className="text-link">Xem quyền lợi vé<SymbolIcon name="arrow" size={18}/></Link></div></section>;
}
export function Gallery(){
 const photos=[{image:PHOTO.lamb,alt:'Du khách cho đàn cừu ăn',caption:'Vườn thú mini'},{image:PHOTO.child,alt:'Em bé gặp đàn cừu cùng người lớn',caption:'Trải nghiệm cùng gia đình'},{image:PHOTO.flowers,alt:'Toàn cảnh những luống hoa tím',caption:'Vườn hoa'},{image:PHOTO.mini,alt:'Tiểu cảnh nhà trên cây giữa khu vườn',caption:'Các góc check-in'}];
 return <section className="gallery" id="bo-suu-tap"><div className="section-shell"><div className="section-heading" data-reveal><span className="eyebrow">BỘ ẢNH</span><h2>Hình ảnh<br/><em>tại Chuồn Chuồn.</em></h2><p>Xem cảnh quan và các hoạt động qua bộ ảnh do Chuồn Chuồn cung cấp. Tình trạng hoa có thể thay đổi theo mùa.</p></div><div className="gallery-grid">{photos.map(p=><figure key={p.image} data-reveal><img src={p.image} alt={p.alt} loading="lazy"/><figcaption>{p.caption}</figcaption></figure>)}</div><div className="media-strip"><figure><img src={PHOTO.campaign2} alt="Ảnh truyền thông nhóm du khách check-in tại Chuồn Chuồn" loading="lazy"/><figcaption>Ảnh truyền thông do Chuồn Chuồn cung cấp</figcaption></figure><div className="media-thumbnail"><img src={PHOTO.sign} alt="Ảnh thu nhỏ đường trượt và biển Chuồn Chuồn" loading="lazy" width="96" height="96"/><p>Góc nhìn đường trượt<br/><span>Ảnh thu nhỏ từ bộ tư liệu</span></p></div></div></div></section>;
}
export function Tickets(){
 return <section className="tickets section-shell" id="chi-tiet"><div className="section-heading" data-reveal><span className="eyebrow">CHỌN VÉ THEO CHIỀU CAO</span><h2>Giá vé tham quan<br/><em>Chuồn Chuồn.</em></h2><p>Giá đã bao gồm VAT, áp dụng như nhau vào ngày thường, cuối tuần và dịp lễ.</p></div><div className="ticket-stack"><article className="ticket-card ticket-adult" data-reveal><span>VÉ NGƯỜI LỚN</span><strong>120.000<small>đ / khách</small></strong><p>Khách cao trên 1,4 m.</p></article><article className="ticket-card" data-reveal><span>VÉ TRẺ EM</span><strong>80.000<small>đ / khách</small></strong><p>Từ 1,0 m đến 1,4 m.</p></article><article className="ticket-card ticket-free" data-reveal><span>TRẺ EM DƯỚI 1,0 M</span><strong>Miễn phí</strong><p>Loại vé được xác định theo chiều cao thực tế.</p></article></div><div className="ticket-details"><div><h3>Đã bao gồm trong vé</h3><p>Vườn hoa và cảnh quan, vườn thú mini, đạp xe trên nước, xích đu ngắm cảnh, Sky Line và trượt phao khô bảy sắc cầu vồng.</p></div><div><h3>Chi phí riêng</h3><p>Ăn uống và thức ăn chuyên dụng để cho thú ăn được tính riêng.</p></div></div></section>;
}
export function TicketPolicy(){return <section className="policy-panel section-shell"><div data-reveal><span className="eyebrow">CÁCH MUA VÉ</span><h2>Mua vé trực tiếp<br/><em>tại điểm tham quan.</em></h2></div><div className="policy-copy" data-reveal><ul><li>Không cần đặt trước đối với khách lẻ.</li><li>Thanh toán bằng tiền mặt hoặc chuyển khoản.</li><li>Vé đã mua không áp dụng đổi ngày, hủy hoặc hoàn tiền, kể cả do thời tiết.</li></ul><Link href="/duong-di" className="text-link">Xem đường đi<SymbolIcon name="arrow"/></Link></div></section>;}
export function Plan(){
 return <section className="plan section-shell" id="chi-tiet"><div className="section-heading" data-reveal><span className="eyebrow">TRƯỚC KHI ĐẾN</span><h2>Những điều nên biết<br/><em>trước khi đến.</em></h2></div><div className="plan-layout"><figure className="plan-photo" data-parallax><img src={PHOTO.family} alt="Gia đình tham quan trên lối đi giữa các luống hoa" loading="lazy"/><figcaption>Khuôn viên có địa hình đồi và nhiều đoạn dốc.</figcaption></figure><div className="plan-facts" id="luu-y"><div data-reveal><span className="eyebrow">GIỜ MỞ CỬA</span><h3>07:30 - 17:00</h3><p>Mở cửa hằng ngày, kể cả ngày lễ; các khu áp dụng giờ chung.</p></div><div data-reveal><span className="eyebrow">ĐIỀU KIỆN THAM GIA</span><h3>Sky Line và trượt phao khô</h3><p>Trẻ em cao trên 1,2 m, đủ điều kiện sức khỏe và tuân theo hướng dẫn nhân viên. Khách có bệnh tim mạch hoặc bệnh lý thần kinh không nên tham gia.</p></div><div data-reveal><span className="eyebrow">ĂN UỐNG</span><h3>Nhà hàng và quầy nước</h3><p>Một nhà hàng chính và ba điểm phục vụ đồ uống; chi phí ăn uống không nằm trong vé.</p></div><div data-reveal><span className="eyebrow">THỜI TIẾT</span><h3>Kiểm tra tình trạng trong ngày</h3><p>Một số hoạt động ngoài trời có thể tạm dừng khi thời tiết không bảo đảm an toàn. Gọi hotline để hỏi tình trạng trong ngày.</p></div></div></div><div className="faq"><div><span className="eyebrow">THÔNG TIN THÊM</span><h2>Câu hỏi<br/><em>trước chuyến đi.</em></h2></div><div>{QUESTIONS.map(q=><details key={q.q}><summary>{q.q}<span aria-hidden="true">+</span></summary><p>{q.a}</p></details>)}</div></div></section>;
}
export function TravelNotes(){return <section className="policy-panel section-shell"><div data-reveal><span className="eyebrow">LƯU Ý THAM QUAN</span><h2>Di chuyển và quy định<br/><em>trong khuôn viên.</em></h2></div><div className="policy-copy" data-reveal><p>Khuôn viên có địa hình đồi và nhiều đoạn dốc. Khách đi cùng trẻ nhỏ, người lớn tuổi hoặc người khó di chuyển nên cân nhắc lộ trình.</p><p>Không mang thức ăn, đồ uống từ bên ngoài vào khu du lịch, ngoại trừ snack nhẹ với số lượng phù hợp.</p><a href={PHONE} className="text-link">Hỏi trực tiếp nhân viên<SymbolIcon name="arrow"/></a></div></section>;}
export function Visit(){return <section className="visit section-shell" id="chi-tiet"><div className="visit-panel" data-reveal><span className="eyebrow">ĐỊA CHỈ & DI CHUYỂN</span><h2>Tìm đường<br/><em>đến Chuồn Chuồn.</em></h2><address>217 Thôn 5, Nam Ban,<br/>Lâm Đồng, Việt Nam</address><div className="visit-facts"><div><strong>18 - 20 km</strong><span>Khoảng cách tham khảo từ trung tâm Đà Lạt</span></div><div><strong>30 - 40 phút</strong><span>Thời gian tham khảo, tùy điểm xuất phát và giao thông</span></div><div><strong>Đỗ xe miễn phí</strong><span>Xe máy, ô tô và xe đoàn lớn</span></div></div><a href={MAP} className="button button-dark" target="_blank" rel="noopener noreferrer">Mở Google Maps<SymbolIcon name="arrow"/></a></div><figure className="visit-photo" data-parallax><img src={PHOTO.bridge} alt="Khu tham quan Chuồn Chuồn trên đồi" loading="lazy"/><figcaption>Nam Ban, Lâm Đồng</figcaption></figure></section>;}
export function Groups(){return <section className="groups section-shell" id="chi-tiet"><div className="groups-copy" data-reveal><span className="eyebrow">TƯ VẤN KHÁCH ĐOÀN</span><h2>Lên kế hoạch<br/><em>cho đoàn của bạn.</em></h2><p>Gửi thông tin đoàn và ngày dự kiến để được tư vấn phương án tham quan, ăn uống và chuẩn bị đón tiếp.</p><div className="group-actions"><a href={EMAIL} className="button button-dark">Gửi email tư vấn đoàn<SymbolIcon name="arrow"/></a><a href={PHONE} className="group-phone"><SymbolIcon name="phone"/>070 288 2299</a></div><p className="group-small">Hotline có nhân viên tiếp nhận: 08:00 - 17:30</p></div><div className="group-checklist" data-reveal><span className="eyebrow">THÔNG TIN ĐỂ TƯ VẤN</span><h3>Khi liên hệ, bạn có thể gửi:</h3><ul><li>Ngày tham quan dự kiến</li><li>Số lượng khách và thành phần đoàn</li><li>Nhu cầu ăn uống, hoạt động</li><li>Thông tin người liên hệ</li></ul><a href={EMAIL}>kinhdoanh.chuonchuon@gmail.com</a></div></section>;}
export function Footer(){return <footer className="footer"><div className="footer-top section-shell"><div><Wordmark light/><p>Điểm tham quan và vui chơi<br/>tại Nam Ban, Lâm Đồng.</p></div><div><strong>KHÁM PHÁ</strong>{NAV.map(item=><Link href={item.href} key={item.href}>{item.label}</Link>)}</div><div><strong>LIÊN HỆ</strong><a href={PHONE}>070 288 2299</a><a href={EMAIL}>kinhdoanh.chuonchuon@gmail.com</a><a href={MAP} target="_blank" rel="noopener noreferrer">217 Thôn 5, Nam Ban, Lâm Đồng ↗</a><span>Giờ mở cửa: 07:30 - 17:00</span></div></div><div className="footer-bottom section-shell"><span>© 2026 ĐIỂM DU LỊCH CHUỒN CHUỒN</span><a href="#noi-dung">Lên đầu trang ↑</a></div></footer>;}
