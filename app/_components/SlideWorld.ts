/** Small perspective renderer: real XYZ geometry, camera projection and depth sorting. */
type V = [number, number, number];
type Face = { points: V[]; color: string; depth?: number };
const sub = (a:V,b:V):V => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot = (a:V,b:V) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross = (a:V,b:V):V => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = (a:V):V => { const l=Math.hypot(...a); return a.map(n=>n/l) as V; };
const track = (t:number):V => [Math.sin(t*Math.PI*1.65)*3.65,3.1-t*5.6,Math.cos(t*Math.PI*1.65)*3.2];
function edge(t:number, side:number, lift=0):V {
  const c=track(t), d=sub(track(t+.001),track(t-.001));
  const normal=unit([-d[2],0,d[0]]);
  return [c[0]+normal[0]*side,c[1]+lift,c[2]+normal[2]*side];
}
const lanes=['#bfe878','#b3dd78','#89c999','#56b9a0','#58c5b9','#c4d77d','#ebdc93'];
export function drawSlide(ctx:CanvasRenderingContext2D,w:number,h:number,p:number,tilt=0) {
  ctx.clearRect(0,0,w,h);
  const angle=.45+p*1.15+tilt*.08;
  const camera:V=[Math.sin(angle)*13,7-p*2.6,Math.cos(angle)*13];
  const target:V=[0,-.3-p*.5,0];
  const forward=unit(sub(target,camera)), right=unit(cross(forward,[0,1,0])), up=cross(right,forward);
  const focal=Math.min(w*.98,h*1.5);
  const project=(v:V) => { const a=sub(v,camera),z=dot(a,forward); return {x:w*.5+dot(a,right)*focal/z,y:h*.5-dot(a,up)*focal/z,z}; };
  const polygon=(points:V[],color:string) => {
    ctx.beginPath(); points.forEach((v,i)=>{const q=project(v); if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});
    ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=.45;ctx.stroke();
  };
  // Ground rings anchor the floating architecture in a coherent space.
  for(let r=2;r<=8;r+=1.5){
    ctx.beginPath();for(let j=0;j<=90;j++){const a=j/90*Math.PI*2,q=project([Math.cos(a)*r,-3.25,Math.sin(a)*r]);if(!j)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);}
    ctx.strokeStyle='rgba(44,100,75,.12)';ctx.lineWidth=1;ctx.stroke();
  }
  const faces:Face[]=[];
  const add=(points:V[],color:string)=>faces.push({points,color,depth:points.reduce((a,v)=>a+project(v).z,0)/points.length});
  const built=.14+p*.86;
  const count=150;
  // Seven lanes, an extruded underside, and raised guardrails.
  for(let i=0;i<count;i++){
    const a=i/count,b=(i+1)/count,lit=a<=built;
    const shade=.78+.17*Math.sin(a*12+angle);
    for(let lane=0;lane<7;lane++){
      const left=-.88+lane*1.76/7,rightSide=left+1.76/7;
      const hex=lit?lanes[lane]:'#d6e3d5';
      const rgb=[1,3,5].map(k=>Math.round(parseInt(hex.slice(k,k+2),16)*shade));
      add([edge(a,left),edge(b,left),edge(b,rightSide),edge(a,rightSide)],`rgb(${rgb.join(',')})`);
    }
    for(const side of [-.91,.91]){
      add([edge(a,side,-.18),edge(b,side,-.18),edge(b,side,.28),edge(a,side,.28)],lit?'#236c58':'#a7bfac');
      add([edge(a,side-.055,.28),edge(b,side-.055,.28),edge(b,side+.055,.28),edge(a,side+.055,.28)],lit?'#ddf7ac':'#f0f4e7');
    }
    if(i%18===0){
      for(const x of [-.55,.55]){
        const e=edge(a,x,-.18),bottom:V=[e[0],-3.25,e[2]];
        add([[e[0]-.07,e[1],e[2]],[e[0]+.07,e[1],e[2]],[bottom[0]+.07,bottom[1],bottom[2]],[bottom[0]-.07,bottom[1],bottom[2]]],'#799d86');
        add([[e[0],e[1],e[2]-.07],[e[0],e[1],e[2]+.07],[bottom[0],bottom[1],bottom[2]+.07],[bottom[0],bottom[1],bottom[2]-.07]],'#abc4a7');
      }
    }
  }
  // A small inner tube travels along the built part of the slide.
  const rider=track(Math.max(.025,built-.045));
  for(let i=0;i<32;i++) for(let j=0;j<8;j++){
    const point=(a:number,b:number):V=>[rider[0]+(.27+.1*Math.cos(b))*Math.cos(a),rider[1]+.19+.1*Math.sin(b),rider[2]+(.27+.1*Math.cos(b))*Math.sin(a)];
    const a=i/32*Math.PI*2,b=j/8*Math.PI*2;
    add([point(a,b),point(a+Math.PI/16,b),point(a+Math.PI/16,b+Math.PI/4),point(a,b+Math.PI/4)],j<4?'#f9d678':'#b48034');
  }
  faces.sort((a,b)=>b.depth!-a.depth!);
  faces.forEach(face=>polygon(face.points,face.color));
}
