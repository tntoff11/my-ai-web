'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {PHOTO} from './content';

const scenes=[
 {label:'Chuồn Chuồn',title:'Một ngày ở Chuồn Chuồn',accent:'bắt đầu từ đây.',text:'Khám phá vườn hoa, các điểm ngắm cảnh và hoạt động ngoài trời tại Nam Ban, Lâm Đồng.',image:PHOTO.hero,alt:'Đường xe trượt uốn quanh những tán hoa tím tại Chuồn Chuồn',secondary:PHOTO.bridge,secondaryAlt:'Công trình tham quan trên đồi',caption:'NAM BAN · LÂM ĐỒNG',href:'/trai-nghiem',cta:'Khám phá Chuồn Chuồn',position:'50% 50%'},
 {label:'Vườn hoa',title:'Đi giữa',accent:'những mùa hoa.',text:'Dạo qua vườn hoa và các tuyến đường trong khuôn viên. Cảnh quan thay đổi theo mùa.',image:PHOTO.flowers,alt:'Toàn cảnh vườn hoa tím và đồi xanh',secondary:PHOTO.family,secondaryAlt:'Gia đình dạo qua vườn hoa',caption:'VƯỜN HOA & ĐƯỜNG DẠO',href:'/trai-nghiem#vuon-hoa',cta:'Xem khu vườn',position:'50% 60%'},
 {label:'Vườn thú',title:'Một điểm dừng',accent:'cho cả gia đình.',text:'Ghé vườn thú mini và tương tác với các loài vật theo hướng dẫn tại khu vực.',image:PHOTO.animal,alt:'Gia đình gặp đàn cừu trong vườn thú mini',secondary:PHOTO.child,secondaryAlt:'Em bé gặp những chú cừu',caption:'VƯỜN THÚ MINI',href:'/trai-nghiem#vuon-thu',cta:'Xem vườn thú mini',position:'58% 50%'},
 {label:'Vui chơi',title:'Khám phá',accent:'từ mặt hồ.',text:'Trải nghiệm đạp xe trên nước và ngắm cảnh từ một góc nhìn khác. Khám phá thêm Sky Line và trượt phao khô trong khuôn viên.',image:PHOTO.lake,alt:'Các nhóm du khách đạp xe trên hồ',secondary:PHOTO.path,secondaryAlt:'Du khách đi xe trượt Sky Line giữa đồi hoa',caption:'ĐẠP XE TRÊN NƯỚC · SKY LINE',href:'/trai-nghiem#sky-line',cta:'Xem hoạt động vui chơi',position:'50% 55%'},
 {label:'Ăn uống',title:'Nhà hàng và',accent:'điểm phục vụ đồ uống.',text:'Một nhà hàng chính và ba điểm phục vụ đồ uống để nghỉ chân trong chuyến tham quan. Chi phí ăn uống được tính riêng.',image:PHOTO.cafe,alt:'Không gian phục vụ ăn uống nhìn ra hồ và cảnh đồi',secondary:PHOTO.mini,secondaryAlt:'Tiểu cảnh nhà trên cây trong khuôn viên',caption:'COFFEE & BISTRO',href:'/trai-nghiem#am-thuc',cta:'Xem thông tin ăn uống',position:'50% 55%'}
];
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export default function ScrollJourney(){
 const root=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null);
 const frames=useRef<(HTMLElement|null)[]>([]),copies=useRef<(HTMLDivElement|null)[]>([]),photos=useRef<(HTMLDivElement|null)[]>([]);
 const path=useRef<SVGPathElement>(null),rider=useRef<SVGGElement>(null);
 const [active,setActive]=useState(0);const indexRef=useRef(0);const mode=useRef(false);
 useEffect(()=>{
  const host=root.current,view=stage.current;if(!host||!view)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const short=window.matchMedia('(max-height: 560px)');
  let frame=0,current=0,target=0,inView=true,lastY=-1;
  const length=path.current?.getTotalLength()??1;
  const draw=()=>{
   frame=0;if(!mode.current)return;
   current+=(target-current)*.16;if(Math.abs(target-current)<.0006)current=target;
   const progress=clamp(current),position=progress*4.5;
   let next=0;for(let i=1;i<scenes.length;i++)if(position>i-.22)next=i;
   if(next!==indexRef.current){indexRef.current=next;setActive(next);}
   frames.current.forEach((scene,i)=>{
    if(!scene)return;
    const reveal=i===0?1:clamp((position-i+.65)/.6);
    const following=i<scenes.length-1?clamp((position-i-.35)/.6):0;
    const visible=reveal>0&&following<1;
    scene.style.visibility=visible?'visible':'hidden';
    scene.style.clipPath=i===0?'none':`ellipse(${reveal*155}% ${reveal*150}% at ${i%2?'100%':'0%'} 100%)`;
    scene.setAttribute('aria-hidden',String(i!==next));scene.inert=i!==next;
    const photo=photos.current[i];
    if(photo){photo.style.transform=`scale(${1.045+(1-reveal)*.12+following*.065}) translate3d(${(1-reveal)*(i%2?3:-3)}%,${-following*1.5}%,0)`;}
    const copy=copies.current[i];
    if(copy){const opacity=clamp((reveal-.45)/.55)*(1-clamp(following*1.5));copy.style.opacity=String(opacity);copy.style.transform=`translate3d(0,${(1-opacity)*28}px,0)`;}
    scene.style.setProperty('--scene-arrival',String(reveal));
   });
   host.style.setProperty('--journey-progress',String(progress));
   if(path.current){path.current.style.strokeDasharray=String(length);path.current.style.strokeDashoffset=String(length*(1-progress));const point=path.current.getPointAtLength(length*progress);rider.current?.setAttribute('transform',`translate(${point.x} ${point.y})`);}
   if(current!==target&&inView&&!document.hidden)frame=requestAnimationFrame(draw);
  };
  const schedule=()=>{if(!frame&&inView&&!document.hidden)frame=requestAnimationFrame(draw);};
  const scroll=()=>{const box=host.getBoundingClientRect();const offset=parseFloat(getComputedStyle(view).top)||0;target=clamp((offset-box.top)/Math.max(1,host.offsetHeight-view.offsetHeight));schedule();};
  const configure=()=>{
   mode.current=!reduced.matches&&!short.matches;host.classList.toggle('journey-immersive',mode.current);
   if(!mode.current){cancelAnimationFrame(frame);frame=0;frames.current.forEach(scene=>{scene?.removeAttribute('style');scene?.removeAttribute('aria-hidden');if(scene)scene.inert=false;});copies.current.forEach(copy=>copy?.removeAttribute('style'));photos.current.forEach(photo=>photo?.removeAttribute('style'));}
   else {scroll();current=target;draw();}
  };
  const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;if(inView)scroll();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'});observer.observe(host);
  // Ignore address-bar height changes during mobile scroll. CSS uses stable viewport units.
  const resize=()=>{if(lastY!==window.innerWidth){lastY=window.innerWidth;configure();}};
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else scroll();};
  configure();lastY=window.innerWidth;
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',resize);reduced.addEventListener('change',configure);short.addEventListener('change',configure);document.addEventListener('visibilitychange',visibility);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',resize);reduced.removeEventListener('change',configure);short.removeEventListener('change',configure);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 const jump=(i:number)=>{const host=root.current,view=stage.current;if(!host||!view)return;if(!mode.current){frames.current[i]?.scrollIntoView({block:'start',behavior:'auto'});return;}const top=parseFloat(getComputedStyle(view).top)||0;window.scrollTo({top:window.scrollY+host.getBoundingClientRect().top-top+(host.offsetHeight-view.offsetHeight)*i/4.5,behavior:'smooth'});};
 return <section className="journey" ref={root} aria-label="Khám phá Chuồn Chuồn qua các khu trải nghiệm"><div className="journey-stage" ref={stage}>
  {scenes.map((scene,i)=><article className={`journey-scene scene-${i}`} key={scene.label} ref={node=>{frames.current[i]=node;}}><div className="scene-photo" ref={node=>{photos.current[i]=node;}}><img src={scene.image} alt={scene.alt} style={{objectPosition:scene.position}} fetchPriority={i===0?'high':'auto'} loading={i<2?'eager':'lazy'} decoding="async"/></div><div className="scene-shade"/><div className="scene-topline"><span>{scene.caption}</span><a href="#thong-tin">Giá vé & thông tin chuyến đi ↗</a></div><div className="scene-copy" ref={node=>{copies.current[i]=node;}}><span className="scene-eyebrow">{i===0?'ĐIỂM DU LỊCH CHUỒN CHUỒN':scene.label}</span>{i===0?<h1>{scene.title}<br/><em>{scene.accent}</em></h1>:<h2>{scene.title}<br/><em>{scene.accent}</em></h2>}<p>{scene.text}</p><div className="scene-actions"><Link href={scene.href} className="button button-light">{scene.cta}<span aria-hidden="true">↗</span></Link>{i===0&&<Link href="/gia-ve" className="scene-ticket">Vé người lớn <strong>120.000đ</strong></Link>}</div></div><figure className="scene-detail"><img src={scene.secondary} alt={scene.secondaryAlt} loading="lazy"/><figcaption>{i===0?'Một góc Chuồn Chuồn':scene.secondaryAlt}</figcaption></figure></article>)}
  <svg className="journey-ribbon" viewBox="0 0 1440 240" preserveAspectRatio="none" fill="none" aria-hidden="true"><defs><linearGradient id="journey-line" x1="0" x2="1440" gradientUnits="userSpaceOnUse"><stop stopColor="#e2f19d"/><stop offset=".5" stopColor="#faf5d6"/><stop offset="1" stopColor="#a6dcba"/></linearGradient></defs><path d="M-20 155C210 10 390 255 620 140S1060 10 1460 140" stroke="#fff" strokeOpacity=".2" strokeWidth="1"/><path d="M-20 165C210 20 390 265 620 150S1060 20 1460 150" stroke="#fff" strokeOpacity=".12" strokeWidth="1"/><path ref={path} d="M-20 145C210 0 390 245 620 130S1060 0 1460 130" stroke="url(#journey-line)" strokeWidth="2.5"/><g ref={rider}><circle r="12" fill="#e3f2af" fillOpacity=".2"/><circle r="4" fill="#eff6bf"/></g></svg>
  <div className="journey-controls"><span className="journey-instruction"><span aria-hidden="true">↓</span> Cuộn để khám phá từng khu</span><nav aria-label="Chọn khu trải nghiệm">{scenes.map((scene,i)=><button key={scene.label} onClick={()=>jump(i)} type="button" aria-pressed={active===i}><span className="scene-dot"/>{scene.label}</button>)}</nav></div><div className="journey-progress" aria-hidden="true"><span/></div>
 </div></section>;
}
