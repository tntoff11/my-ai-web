'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const scenes = [
  { name: 'Giữa mùa hoa', tag: 'CẢNH QUAN & CHECK-IN', image: 'toan-canh-vuon-hoa.jpg', alt: 'Những dải hoa tím trải dài trên đồi tại Chuồn Chuồn', text: 'Một khúc quanh, một góc nhìn mới.' },
  { name: 'Gặp bạn nhỏ', tag: 'VƯỜN THÚ MINI', image: 'gia-dinh-vuon-thu.jpg', alt: 'Gia đình tương tác với đàn cừu tại vườn thú mini', text: 'Những cuộc gặp làm chuyến đi thêm đáng nhớ.' },
  { name: 'Theo nhịp nước', tag: 'ĐẠP XE TRÊN NƯỚC', image: 'dap-xe-tren-nuoc.jpg', alt: 'Du khách đạp xe trên mặt hồ giữa thiên nhiên', text: 'Đổi nhịp khám phá. Mở thêm một khoảng trời.' },
];
const clamp = (x: number, low = 0, high = 1) => Math.min(high, Math.max(low, x));

export default function ScrollJourney() {
  const host = useRef<HTMLElement>(null);
  const line = useRef<SVGPathElement>(null);
  const marker = useRef<SVGGElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = host.current;
    if (!section) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let previous = -1;
    const pathLength = line.current?.getTotalLength() ?? 0;
    const draw = () => {
      frame = 0;
      if (media.matches) {
        section.classList.remove('journey-enhanced');
        cards.current.forEach(card => {
          card?.removeAttribute('style');
          card?.removeAttribute('aria-hidden');
        });
        return;
      }
      section.classList.add('journey-enhanced');
      const box = section.getBoundingClientRect();
      const top = window.innerWidth <= 850 ? 78 : 92;
      const travel = Math.max(1, box.height - (window.innerHeight - top));
      const p = clamp((top - box.top) / travel);
      section.style.setProperty('--journey-progress', String(p));
      section.style.setProperty('--camera-turn', `${-17 + p * 31}deg`);
      section.style.setProperty('--camera-rise', `${70 - p * 125}px`);
      const path = line.current;
      if (path) {
        const length = pathLength;
        path.style.strokeDasharray = String(length);
        path.style.strokeDashoffset = String(length * (1 - p));
        const point = path.getPointAtLength(length * p);
        marker.current?.setAttribute('transform', `translate(${point.x} ${point.y})`);
      }
      const stage = p * (scenes.length - 1);
      const next = Math.round(stage);
      if (next !== previous) { previous = next; setActive(next); }
      cards.current.forEach((card, index) => {
        if (!card) return;
        const offset = index - stage;
        const visible = Math.abs(offset) < .73;
        card.style.opacity = String(clamp(1 - Math.abs(offset) * 1.6));
        card.style.visibility = visible ? 'visible' : 'hidden';
        card.style.transform = `translate3d(${offset * 72}%, ${Math.abs(offset) * 46}px, ${-Math.abs(offset) * 330}px) rotateY(${offset * -28}deg) rotateZ(${offset * 5}deg)`;
        card.style.pointerEvents = Math.abs(offset) < .5 ? 'auto' : 'none';
        card.setAttribute('aria-hidden', String(Math.abs(offset) > .5));
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    draw();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    media.addEventListener('change', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      media.removeEventListener('change', schedule);
    };
  }, []);

  const moveTo = (index: number) => {
    const section = host.current;
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.current[index]?.scrollIntoView({ block: 'center' }); return;
    }
    const top = window.innerWidth <= 850 ? 78 : 92;
    const box = section.getBoundingClientRect();
    const distance = box.height - (window.innerHeight - top);
    window.scrollTo({ top: window.scrollY + box.top - top + distance * index / (scenes.length - 1), behavior: 'smooth' });
  };

  return <section ref={host} className="scroll-journey" aria-labelledby="journey-title">
    <div className="journey-stage">
      <div className="journey-grid" aria-hidden="true" />
      <div className="journey-aura" aria-hidden="true" />
      <header className="journey-heading"><span className="eyebrow">CUỘN ĐỂ MỞ HÀNH TRÌNH</span><h2 id="journey-title">Mỗi khúc quanh.<br /><em>Một điều bất ngờ.</em></h2></header>
      <div className="journey-world" aria-hidden="true"><svg viewBox="0 0 1000 700" className="journey-ribbon" fill="none"><defs><linearGradient id="journey-colour" x1="120" y1="0" x2="850" y2="700" gradientUnits="userSpaceOnUse"><stop stopColor="#c9f589"/><stop offset=".45" stopColor="#5bd8b2"/><stop offset="1" stopColor="#d7ed75"/></linearGradient></defs><path className="ribbon-depth" d="M100 70C850-80 1020 215 530 245S-130 450 390 465 1050 600 850 715"/><path className="ribbon-under" d="M100 70C850-80 1020 215 530 245S-130 450 390 465 1050 600 850 715"/><path ref={line} className="ribbon-lit" d="M100 70C850-80 1020 215 530 245S-130 450 390 465 1050 600 850 715"/><g ref={marker} className="ribbon-marker"><circle r="24" fill="#e5ffaf" fillOpacity=".2"/><circle r="10" fill="#efffcd"/><circle r="4" fill="#1a5441"/></g></svg></div>
      <div className="journey-cards">{scenes.map((scene,index) => <article ref={node => { cards.current[index]=node; }} className="journey-card" key={scene.name}><div className="journey-card-photo"><img src={`/images/chuon-chuon/${scene.image}`} alt={scene.alt} loading="lazy" decoding="async"/><span>{scene.tag}</span></div><div className="journey-card-caption"><h3>{scene.name}</h3><p>{scene.text}</p></div></article>)}</div>
      <div className="journey-controls"><div className="journey-tabs" aria-label="Chọn cảnh trải nghiệm">{scenes.map((scene,index) => <button type="button" key={scene.name} aria-pressed={active===index} onClick={() => moveTo(index)}>{scene.name}</button>)}</div><Link href="/trai-nghiem" className="journey-explore">Khám phá các trải nghiệm <span aria-hidden="true">↗</span></Link></div>
      <div className="journey-meter" aria-hidden="true"><span /></div>
    </div>
  </section>;
}
