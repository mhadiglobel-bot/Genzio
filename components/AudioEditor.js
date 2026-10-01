'use client';
import {useEffect,useRef,useState} from 'react';

function fmt(sec=0){const m=Math.floor(sec/60);const s=(sec%60).toFixed(2).padStart(5,'0');return `${String(m).padStart(2,'0')}:${s}`}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}

export default function AudioEditor(){
  const canvasRef=useRef(null); const audioCtxRef=useRef(null); const bufferRef=useRef(null); const sourceRef=useRef(null);
  const [name,setName]=useState(''); const [duration,setDuration]=useState(0); const [sel,setSel]=useState({start:0,end:0}); const [drag,setDrag]=useState(null);
  const [regions,setRegions]=useState([]); const [cuts,setCuts]=useState([]); const [status,setStatus]=useState('Upload an audio file to begin.');
  const [playing,setPlaying]=useState(false); const [fx,setFx]=useState({gain:0,bass:0,delay:0,feedback:.28,mix:.25,pan:0}); const [bitrate,setBitrate]=useState(320);

  useEffect(()=>{draw()},[duration,sel,regions,cuts]);

  async function loadFile(file){
    if(!file)return; setStatus('Decoding audio locally...'); setName(file.name);
    const arr=await file.arrayBuffer(); const AC=window.AudioContext||window.webkitAudioContext; if(!audioCtxRef.current)audioCtxRef.current=new AC();
    try{const buf=await audioCtxRef.current.decodeAudioData(arr.slice(0)); bufferRef.current=buf; setDuration(buf.duration); setSel({start:0,end:Math.min(5,buf.duration)}); setRegions([]); setCuts([]); setStatus(`Loaded ${file.name} • ${buf.numberOfChannels} channel(s) • ${buf.sampleRate} Hz`); requestAnimationFrame(draw);}catch(e){setStatus('This browser could not decode that file. Try MP3, WAV, AAC/M4A supported by your browser.');}
  }

  function xToTime(x){const c=canvasRef.current; const r=c.getBoundingClientRect(); return clamp(((x-r.left)/r.width)*duration,0,duration)}
  function pointerDown(e){if(!duration)return; const t=xToTime(e.clientX); setDrag(t); setSel({start:t,end:t})}
  function pointerMove(e){if(drag===null)return; const t=xToTime(e.clientX); setSel({start:Math.min(drag,t),end:Math.max(drag,t)})}
  function pointerUp(){setDrag(null)}

  function draw(){
    const c=canvasRef.current,b=bufferRef.current;if(!c)return; const dpr=window.devicePixelRatio||1; const rect=c.getBoundingClientRect(); c.width=Math.max(1,rect.width*dpr); c.height=Math.max(1,rect.height*dpr); const g=c.getContext('2d');g.scale(dpr,dpr); const w=rect.width,h=rect.height;g.clearRect(0,0,w,h);g.fillStyle='#0a0d15';g.fillRect(0,0,w,h);
    if(!b)return; const data=b.getChannelData(0), step=Math.ceil(data.length/w), amp=h*.38; g.strokeStyle='#66d9ff';g.lineWidth=1;g.beginPath(); for(let x=0;x<w;x++){let min=1,max=-1; const start=x*step; for(let j=0;j<step&&start+j<data.length;j++){const v=data[start+j];if(v<min)min=v;if(v>max)max=v} g.moveTo(x,h/2+min*amp);g.lineTo(x,h/2+max*amp)}g.stroke();
    cuts.forEach(r=>{g.fillStyle='rgba(255,80,110,.18)';g.fillRect(r.start/duration*w,0,(r.end-r.start)/duration*w,h)}); regions.forEach(r=>{g.fillStyle='rgba(132,108,255,.14)';g.fillRect(r.start/duration*w,0,(r.end-r.start)/duration*w,h)});
    const s=sel.start/duration*w,e=sel.end/duration*w;g.fillStyle='rgba(39,215,255,.13)';g.fillRect(s,0,Math.max(2,e-s),h);g.strokeStyle='#27d7ff';g.lineWidth=2;g.strokeRect(s+1,1,Math.max(2,e-s)-2,h-2);
  }

  function addEffectRegion(){if(sel.end-sel.start<.03)return setStatus('Select a timeline range first.'); setRegions(v=>[...v,{id:crypto.randomUUID(),...sel,fx:{...fx}}]);setStatus(`Effect region added: ${fmt(sel.start)} → ${fmt(sel.end)}`)}
  function addCut(){if(sel.end-sel.start<.03)return setStatus('Select the audio range you want to remove.'); setCuts(v=>[...v,{id:crypto.randomUUID(),...sel}]);setStatus(`Cut range marked: ${fmt(sel.start)} → ${fmt(sel.end)}`)}
  function clearAll(){setRegions([]);setCuts([]);setStatus('All regions cleared. Original upload remains unchanged.')}

  function isCutAt(t){return cuts.some(c=>t>=c.start&&t<c.end)}
  function regionAt(t){return regions.filter(r=>t>=r.start&&t<r.end)}

  async function renderBuffer(){
    const src=bufferRef.current;if(!src)throw new Error('No audio loaded'); const sr=src.sampleRate; const keptDur=Math.max(.01,duration-cuts.reduce((n,c)=>n+Math.max(0,c.end-c.start),0)); const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext; const off=new Offline(2,Math.ceil(keptDur*sr),sr);
    // Build many short source segments so effect settings can change only where selected.
    const boundaries=new Set([0,duration]); cuts.forEach(c=>{boundaries.add(c.start);boundaries.add(c.end)}); regions.forEach(r=>{boundaries.add(r.start);boundaries.add(r.end)}); const points=[...boundaries].sort((a,b)=>a-b);
    let outAt=0;
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],len=b-a;if(len<=0||isCutAt((a+b)/2))continue;
      const s=off.createBufferSource();s.buffer=src;
      let node=s;
      const active=regionAt((a+b)/2);
      // Merge overlapping regions by applying each chain in insertion order.
      for(const r of active){
        const low=off.createBiquadFilter();low.type='lowshelf';low.frequency.value=180;low.gain.value=r.fx.bass||0;node.connect(low);node=low;
        const gain=off.createGain();gain.gain.value=Math.pow(10,(r.fx.gain||0)/20);node.connect(gain);node=gain;
        if(Math.abs(r.fx.pan||0)>.001&&off.createStereoPanner){const p=off.createStereoPanner();p.pan.value=r.fx.pan;node.connect(p);node=p}
        if((r.fx.delay||0)>0){const input=node, dry=off.createGain(), wet=off.createGain(), delay=off.createDelay(2), fb=off.createGain(), sum=off.createGain(); dry.gain.value=1-(r.fx.mix||0);wet.gain.value=r.fx.mix||0;delay.delayTime.value=r.fx.delay;fb.gain.value=clamp(r.fx.feedback||0,0,.82);input.connect(dry);dry.connect(sum);input.connect(delay);delay.connect(wet);wet.connect(sum);delay.connect(fb);fb.connect(delay);node=sum}
      }
      node.connect(off.destination);s.start(outAt,a,len);s.stop(outAt+len);outAt+=len;
    }
    const rendered=await off.startRendering();
    // Peak normalize conservatively to avoid clipping/loudness explosions.
    let peak=0;for(let ch=0;ch<rendered.numberOfChannels;ch++){const d=rendered.getChannelData(ch);for(let i=0;i<d.length;i+=16)peak=Math.max(peak,Math.abs(d[i]))}
    if(peak>0.98){const scale=.98/peak;for(let ch=0;ch<rendered.numberOfChannels;ch++){const d=rendered.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]*=scale}}
    return rendered;
  }

  async function preview(){
    try{stop();setStatus('Rendering preview with your exact regions...');const r=await renderBuffer();const ctx=audioCtxRef.current;const s=ctx.createBufferSource();s.buffer=r;const gain=ctx.createGain();gain.gain.value=.9;s.connect(gain);gain.connect(ctx.destination);s.onended=()=>setPlaying(false);s.start();sourceRef.current=s;setPlaying(true);setStatus('Preview playing. Master preview gain is capped to protect against accidental clipping.')}catch(e){setStatus(e.message)}
  }
  function stop(){try{sourceRef.current?.stop()}catch{} sourceRef.current=null;setPlaying(false)}

  async function exportMp3(){
    if(!bufferRef.current)return setStatus('Upload audio first.');setStatus(`Rendering stereo MP3 at ${bitrate} kbps...`);
    try{
      const rendered=await renderBuffer(); const lame=await import('lamejs'); const Mp3Encoder=lame.Mp3Encoder||lame.default?.Mp3Encoder; const sr=rendered.sampleRate; const enc=new Mp3Encoder(2,sr,Number(bitrate)); const left=rendered.getChannelData(0); const right=rendered.numberOfChannels>1?rendered.getChannelData(1):left; const block=1152,parts=[];
      const to16=f=>{const o=new Int16Array(f.length);for(let i=0;i<f.length;i++){const s=Math.max(-1,Math.min(1,f[i]));o[i]=s<0?s*32768:s*32767}return o}; const l16=to16(left),r16=to16(right);
      for(let i=0;i<l16.length;i+=block){const mp3=enc.encodeBuffer(l16.subarray(i,i+block),r16.subarray(i,i+block));if(mp3.length)parts.push(new Int8Array(mp3))} const end=enc.flush();if(end.length)parts.push(new Int8Array(end));
      const blob=new Blob(parts,{type:'audio/mpeg'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(name.replace(/\.[^.]+$/,'')||'edited-audio')+`-${bitrate}kbps.mp3`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);setStatus(`Export complete • Stereo MP3 • ${bitrate} kbps`);
    }catch(e){console.error(e);setStatus('MP3 export failed in this browser. See README troubleshooting notes.')}
  }

  return <div className="editorShell">
    <div className="toolbar"><label>Upload audio <input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac" onChange={e=>loadFile(e.target.files?.[0])}/></label><button onClick={preview}>{playing?'Restart preview':'Preview edit'}</button><button onClick={stop}>Stop</button><button onClick={clearAll}>Clear regions</button><select value={bitrate} onChange={e=>setBitrate(e.target.value)}><option>128</option><option>192</option><option>256</option><option>320</option></select><button onClick={exportMp3}>Export MP3</button></div>
    <div className="timeline"><div className="canvasWrap"><canvas ref={canvasRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerLeave={pointerUp}/></div><div className="selectionTag">Selection: <b>{fmt(sel.start)}</b> → <b>{fmt(sel.end)}</b> ({(sel.end-sel.start).toFixed(2)} sec) • Track: {fmt(duration)}</div></div>
    <div className="editorGrid"><section className="panel"><h3>Selected-region effects</h3><p className="notice">Effects added here apply only to the currently selected timeline range. You can create multiple regions with different settings.</p><div className="effectGrid">
      <div className="control"><label>Gain: {fx.gain} dB</label><input type="range" min="-18" max="12" step=".5" value={fx.gain} onChange={e=>setFx({...fx,gain:+e.target.value})}/></div>
      <div className="control"><label>Bass: {fx.bass} dB</label><input type="range" min="-12" max="12" step=".5" value={fx.bass} onChange={e=>setFx({...fx,bass:+e.target.value})}/></div>
      <div className="control"><label>Delay / Echo time: {fx.delay}s</label><input type="range" min="0" max="1.2" step=".01" value={fx.delay} onChange={e=>setFx({...fx,delay:+e.target.value})}/></div>
      <div className="control"><label>Echo feedback: {Math.round(fx.feedback*100)}%</label><input type="range" min="0" max=".82" step=".01" value={fx.feedback} onChange={e=>setFx({...fx,feedback:+e.target.value})}/></div>
      <div className="control"><label>Wet mix: {Math.round(fx.mix*100)}%</label><input type="range" min="0" max=".8" step=".01" value={fx.mix} onChange={e=>setFx({...fx,mix:+e.target.value})}/></div>
      <div className="control"><label>Pan: {fx.pan}</label><input type="range" min="-1" max="1" step=".05" value={fx.pan} onChange={e=>setFx({...fx,pan:+e.target.value})}/></div>
    </div><div className="toolbar" style={{marginTop:14}}><button onClick={addEffectRegion}>Apply effects to selection</button><button className="danger" onClick={addCut}>Cut selected range</button></div></section>
    <aside className="panel"><h3>Edit stack</h3><div className="regionList">{regions.length===0&&cuts.length===0?<p className="selectionTag">No edits yet.</p>:null}{regions.map((r,i)=><div className="region" key={r.id}><span>FX {i+1}: {fmt(r.start)}–{fmt(r.end)}<br/><small>Bass {r.fx.bass} dB • Delay {r.fx.delay}s • Gain {r.fx.gain} dB</small></span><button onClick={()=>setRegions(v=>v.filter(x=>x.id!==r.id))}>×</button></div>)}{cuts.map((r,i)=><div className="region" key={r.id}><span className="danger">CUT {i+1}: {fmt(r.start)}–{fmt(r.end)}</span><button onClick={()=>setCuts(v=>v.filter(x=>x.id!==r.id))}>×</button></div>)}</div></aside></div>
    <p className="status">{status}</p>
  </div>
}
