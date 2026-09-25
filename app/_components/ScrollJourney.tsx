'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { drawSlide } from './SlideWorld';

const scenes = [
  { label:'Mở hành trình', title:'Trượt vào', accent:'một ngày xanh.', text:'Chuồn Chuồn Coffee & Bistro. Một điểm hẹn giữa thiên nhiên Nam Ban, Lâm Đồng.', image:'toan-canh-vuon-hoa.jpg', alt:'Toàn cảnh vườn hoa tại Chuồn Chuồn' },
  { label:'Giữa mùa hoa', title:'Đổi góc nhìn.', accent:'Chạm thiên nhiên.', text:'Theo lối hoa, tìm một góc thật riêng. Để cả khung hình ngập tràn sắc xanh.', image:'loi-di-giua-vuon-hoa.jpg', alt:'Lối đi giữa những dải hoa trong khu du lịch' },
  { label:'Gặp bạn nhỏ', title:'Gần thêm chút.', accent:'Vui thêm nhiều.', text:'Những cuộc gặp ở vườn thú mini làm chuyến đi của cả nhà thêm đáng nhớ.', image:'gia-dinh-vuon-thu.jpg', alt:'Gia đình gặp những chú cừu ở vườn thú mini' },
  { label:'Theo nhịp nước', title:'Thả nhịp chậm.', accent:'Mở niềm vui.', text:'Đạp xe trên nước, ngắm cảnh và khám phá thêm những trải nghiệm ngoài trời.', image:'dap-xe-tren-nuoc.jpg', alt:'Du khách trải nghiệm đạp xe trên nước' },
];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));

export default function ScrollJourney(){
  const host=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const photos=useRef<(HTMLDivElement|null)[]>([]);
  const [active,setActive]=useState(0);
  const [reduced,setReduced]=useState(false);
  const activeRef=useRef(0);
  useEffect(()=>{
    const section=host.current, surface=canvas.current;
    if(!section||!surface)return;
    const ctx=surface.getContext('2d');
    if(!ctx)return;
    const media=window.matchMedia('(prefers-reduced-motion: reduce), (max-height: 540px)');
    let frame=0,current=0,target=0,tilt=0,width=0,height=0,visible=true;
    const resize=()=>{
      const box=surface.getBoundingClientRect();width=box.width;height=box.height;
      const dpr=Math.min(window.devicePixelRatio||1,1.75);
      surface.width=Math.round(width*dpr);surface.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const render=()=>{
      frame=0;
      current=media.matches?target:current+(target-current)*.13;
      if(Math.abs(current-target)<.0005)current=target;
      const p=clamp(current);
      drawSlide(ctx,width,height,p,tilt);
      section.style.setProperty('--ride-progress',String(p));
      section.style.setProperty('--ride-pan',`${p*-8}%`);
      const next=Math.min(3,Math.floor(p*3.7));
      if(next!==activeRef.current){activeRef.current=next;setActive(next);}
      photos.current.forEach((photo,index)=>{
        if(!photo)return;
        const reveal=index===0?1:clamp((p-(index-.35)/3.7)*3.7/ .55);
        photo.style.clipPath=`circle(${reveal*145}% at 80% 85%)`;
        photo.style.transform=`scale(${1.09-reveal*.09})`;
      });
      if(current!==target&&visible&&!document.hidden)frame=requestAnimationFrame(render);
    };
    const schedule=()=>{if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(render);};
    const scroll=()=>{
      const box=section.getBoundingClientRect();
      const stage=section.querySelector<HTMLElement>('.ride-stage');
      target=media.matches?activeRef.current/3:clamp(-box.top/Math.max(1,box.height-(stage?.offsetHeight??window.innerHeight)));
      schedule();
    };
    const change=()=>{
      setReduced(media.matches);
      section.classList.toggle('ride-reduced',media.matches);
      resize();scroll();
    };
    const onResize=()=>{resize();scroll();};
    const pointer=(event:PointerEvent)=>{if(event.pointerType==='mouse'&&!media.matches){tilt=(event.clientX/window.innerWidth-.5)*2;schedule();}};
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){resize();scroll();}else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'});
    observer.observe(section);
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else scroll();};
    change();
    window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',onResize);
    section.addEventListener('pointermove',pointer);media.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',onResize);section.removeEventListener('pointermove',pointer);media.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  const jump=(index:number)=>{
    const section=host.current;if(!section)return;
    if(reduced){activeRef.current=index;setActive(index);window.dispatchEvent(new Event('scroll'));return;}
    const stage=section.querySelector<HTMLElement>('.ride-stage');
    const distance=section.offsetHeight-(stage?.offsetHeight??window.innerHeight);
    window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top+distance*(index===0?0:(index+.15)/3.7),behavior:'smooth'});
  };
  return <section ref={host} className="ride" aria-label="Hành trình khám phá Chuồn Chuồn">
    <div className="ride-stage">
      <div className="ride-orbit" aria-hidden="true"/>
      <div className="ride-topline"><span>NAM BAN · LÂM ĐỒNG</span><span>THIÊN NHIÊN. THEO CÁCH CỦA BẠN.</span></div>
      <div className="ride-copy" key={active}>
        <span className="ride-kicker"><i/>{scenes[active].label}</span>
        <h1>{scenes[active].title}<br/><span>{scenes[active].accent}</span></h1>
        <p>{scenes[active].text}</p>
        <Link href={active===0?'/len-ke-hoach':'/trai-nghiem'} className="ride-cta">{active===0?'Hẹn một ngày ở Chuồn Chuồn':'Khám phá trải nghiệm'}<span aria-hidden="true">↗</span></Link>
      </div>
      <div className="ride-photo-window">{scenes.map((scene,index)=><div className="ride-photo" ref={node=>{photos.current[index]=node;}} key={scene.image} style={{clipPath:index===0?'none':'circle(0% at 80% 85%)'}} aria-hidden={active!==index}><img src={`/images/chuon-chuon/${scene.image}`} alt={scene.alt} fetchPriority={index===0?'high':'auto'} loading={index===0?'eager':'lazy'}/></div>)}<div className="ride-photo-caption">CHUỒN CHUỒN <span>COFFEE & BISTRO</span></div></div>
      <canvas ref={canvas} className="ride-canvas" aria-label="Mô hình đường trượt bảy làn, có thành và trụ đỡ; góc nhìn thay đổi theo cuộn" role="img"/>
      <span className="ride-model-note">CẢM HỨNG TỪ ĐƯỜNG TRƯỢT CẦU VỒNG</span>
      <div className="ride-bottom"><div className="ride-scroll-hint"><span aria-hidden="true">↓</span>{reduced?'Chọn một cảnh để khám phá':'Cuộn để mở hành trình'}</div><nav className="ride-tabs" aria-label="Các cảnh trong hành trình">{scenes.map((scene,index)=><button key={scene.label} type="button" onClick={()=>jump(index)} aria-pressed={active===index}>{scene.label}</button>)}</nav></div>
      <div className="ride-progress" aria-hidden="true"><span/></div>
    </div>
  </section>;
}
