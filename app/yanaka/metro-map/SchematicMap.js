'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { ArrowLeft, Plus, Minus, Maximize, Download, Printer, Search, X, Layers } from 'lucide-react';
import styles from './map.module.css';

export default function SchematicMap({ diagram }) {
  const { routes, stations, sheet } = diagram;
  const svgRef=useRef(null),groupRef=useRef(null),zoomRef=useRef(null),viewportRef=useRef(null);
  const [active,setActive]=useState(null),[query,setQuery]=useState(''),[selected,setSelected]=useState(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[legendOpen,setLegendOpen]=useState(false);
  const searchResults=query.trim()?stations.filter(s=>s.names.some(n=>n.includes(query.trim()))).slice(0,8):[];
  useEffect(()=>{
    const svg=select(svgRef.current);
    const behavior=zoom().scaleExtent([0.65,12]).on('zoom',event=>select(groupRef.current).attr('transform',event.transform));
    svg.call(behavior);
    zoomRef.current=behavior;
    return ()=>{svg.on('.zoom',null);zoomRef.current=null;};
  },[]);
  function reset(){select(svgRef.current).call(zoomRef.current.transform,zoomIdentity);setSelected(null);setActive(null);}
  function focusStation(station){
    setSelected(station.id);setQuery('');setLegendOpen(false);
    const k=3.2;
    select(svgRef.current).call(zoomRef.current.transform,zoomIdentity.translate(sheet.width/2-station.x*k,sheet.height/2-station.y*k).scale(k));
  }
  function makeSVG(){
    const copy=svgRef.current.cloneNode(true);
    copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',sheet.width);copy.setAttribute('height',sheet.height);
    copy.querySelector('[data-map-content]').removeAttribute('transform');
    copy.querySelectorAll('[opacity]').forEach(n=>n.removeAttribute('opacity'));
    copy.querySelectorAll('[data-selection]').forEach(n=>n.remove());
    return new XMLSerializer().serializeToString(copy);
  }
  function save(blob,name){
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function download(format){
    setBusy(true);setError('');
    let url;
    try {
      await document.fonts.ready;
      const blob=new Blob([makeSVG()],{type:'image/svg+xml;charset=utf-8'});
      if(format==='svg'){save(blob,'yanaka-metropolitan-network.svg');return;}
      url=URL.createObjectURL(blob);
      const img=new Image();img.src=url;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=sheet.width;canvas.height=sheet.height;
      const context=canvas.getContext('2d');if(!context)throw new Error('canvas');
      context.fillStyle='#fff';context.fillRect(0,0,sheet.width,sheet.height);context.drawImage(img,0,0);
      const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw new Error('export');
      save(png,'yanaka-metropolitan-network.png');
    }catch{setError('画像を保存できませんでした。もう一度お試しください。');}
    finally{if(url)URL.revokeObjectURL(url);setBusy(false);}
  }
  const chosen=stations.find(s=>s.id===selected);
  return <main className={styles.app}>
    <header className={styles.toolbar}>
      <Link href='/yanaka/routemap' className={styles.icon} title='路線図一覧へ' aria-label='路線図一覧へ'><ArrowLeft size={20}/></Link>
      <div className={styles.title}><strong>首都圏路線網図</strong><span>谷中日本鉄道</span></div>
      <div className={styles.search}>
        <Search size={17}/><input aria-label='駅名を検索' placeholder='駅名を検索' value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && searchResults[0])focusStation(searchResults[0]);if(e.key==='Escape')setQuery('');}}/>
        {query && <button title='検索をクリア' aria-label='検索をクリア' onClick={()=>setQuery('')}><X size={16}/></button>}
        {query && <div className={styles.results}>{searchResults.length?searchResults.map(s=><button key={s.id} onClick={()=>focusStation(s)}>{s.name}</button>):<p>該当する駅はありません</p>}</div>}
      </div>
      <div className={styles.exports}>
        <button onClick={()=>download('svg')} disabled={busy}><Download size={16}/>SVG</button>
        <button onClick={()=>download('png')} disabled={busy}><Download size={16}/>PNG</button>
        <button className={styles.icon} title='印刷' aria-label='印刷' onClick={()=>window.print()}><Printer size={19}/></button>
      </div>
    </header>
    <div className={styles.body}>
      <aside className={`${styles.legend} ${legendOpen?styles.open:''}`}>
        <div className={styles.legendHeading}><strong>路線一覧</strong><span>{routes.length}路線</span></div>
        <button className={styles.all} aria-pressed={!active} onClick={()=>setActive(null)}>全路線</button>
        {routes.map(r=><button key={r.id} aria-pressed={active===r.id} onClick={()=>{setActive(active===r.id?null:r.id);setSelected(null);}} className={styles.route}><span style={{background:r.color}}/><span>{r.name}</span><small>{r.stops.length}駅</small></button>)}
        <p className={styles.note}>架空鉄道の路線図です。駅間距離・位置関係は模式化しています。</p>
        <Link href='/yanaka/map-3d' className={styles.other}>3D路線図</Link>
      </aside>
      <section className={styles.viewport} ref={viewportRef} aria-label='首都圏路線網図'>
        <svg ref={svgRef} viewBox={`0 0 ${sheet.width} ${sheet.height}`} className={styles.svg} role='img' aria-label={`谷中日本鉄道 首都圏${routes.length}路線 ${stations.length}駅の平面路線図`}>
          <title>谷中日本鉄道 首都圏路線網図</title>
          <g ref={groupRef} data-map-content='' fontFamily='Arial, "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif'>
            <rect width={sheet.width} height={sheet.height} fill='white'/>
            <rect x='75' y='75' width='15' height='115' fill='#e5b92b'/><rect x='100' y='75' width='15' height='115' fill='#18804a'/>
            <text x='150' y='126' fontSize='57' fontWeight='700' fill='#17252a'>谷中日本鉄道　首都圏路線網図</text>
            <text x='152' y='181' fontSize='25' letterSpacing='0' fill='#667176'>YANAKA JAPAN RAILWAY / METROPOLITAN NETWORK</text>
            <g fill='#526268' stroke='#526268' aria-label='北が上'>
              <text x='4290' y='102' textAnchor='middle' fontSize='25' stroke='none'>北</text>
              <path d='M4290 185 V125 M4276 141 L4290 125 L4304 141' fill='none' strokeWidth='4' strokeLinejoin='round'/>
            </g>
            <line x1='75' x2='4385' y1='225' y2='225' stroke='#18804a' strokeWidth='5'/>
            {routes.map(r=><g key={r.id} opacity={active && active!==r.id?0.12:1}><polyline points={r.path.map(p=>p.join(',')).join(' ')} fill='none' stroke='white' strokeWidth='20' strokeLinejoin='round'/><polyline points={r.path.map(p=>p.join(',')).join(' ')} fill='none' stroke={r.color} strokeWidth='11' strokeLinejoin='round' strokeLinecap='round'/></g>)}
            {stations.map(s=><g key={s.id} opacity={active && !s.routes.includes(active)?0.16:1}>
              {s.label.distance>38 && <line x1={s.x} y1={s.y} x2={s.label.x} y2={s.label.y} stroke='#9ba6ab' strokeWidth='1.1'/>}
              {s.routes.length>1 && <g strokeLinecap='round'>
                {s.platforms.map((p,i)=><line key={`outline-${i}`} x1={s.x} y1={s.y} x2={p.x} y2={p.y} stroke='#243239' strokeWidth='24'/>)}
                {s.platforms.map((p,i)=><line key={`fill-${i}`} x1={s.x} y1={s.y} x2={p.x} y2={p.y} stroke='white' strokeWidth='18'/>)}
              </g>}
              {s.platforms.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r='8' fill='white' stroke={routes.find(r=>r.id===p.route).color} strokeWidth='2.5'/>)}
              {selected===s.id && <circle data-selection='' cx={s.x} cy={s.y} r='25' fill='none' stroke='#ec562c' strokeWidth='5'/>}
              <text x={s.label.x} y={s.label.y} textAnchor={s.label.anchor} dominantBaseline='central' fontSize={s.label.size} fontWeight={s.routes.length>1?'700':'500'} fill='#17252a' stroke='white' strokeWidth='6' paintOrder='stroke' strokeLinejoin='round'>{s.name}</text>
              <title>{`${s.names.join(' / ')}: ${s.routes.map(id=>routes.find(r=>r.id===id).name).join('・')}`}</title>
            </g>)}
            {routes.map((r,i)=><g key={r.id} transform={`translate(${90+(i%5)*865},${3780+Math.floor(i/5)*57})`}><line x1='0' y1='0' x2='50' y2='0' stroke={r.color} strokeWidth='11'/><text x='67' y='8' fontSize='23' fill='#243239'>{r.name}</text></g>)}
            <text x='90' y='3970' fontSize='20' fill='#626c70'>○ 駅　◎ 乗換駅　｜　架空鉄道・駅間距離と位置関係は模式化　｜　東北ラインは大宮まで掲載</text>
          </g>
        </svg>
        <div className={styles.controls}>
          <button title='拡大' aria-label='拡大' onClick={()=>select(svgRef.current).call(zoomRef.current.scaleBy,1.5)}><Plus size={20}/></button>
          <button title='縮小' aria-label='縮小' onClick={()=>select(svgRef.current).call(zoomRef.current.scaleBy,1/1.5)}><Minus size={20}/></button>
          <button title='全体を表示' aria-label='全体を表示' onClick={reset}><Maximize size={19}/></button>
          <button className={styles.mobileLegend} title='路線一覧' aria-label='路線一覧' aria-expanded={legendOpen} onClick={()=>setLegendOpen(!legendOpen)}><Layers size={20}/></button>
        </div>
        {chosen && <div className={styles.station}><button title='駅情報を閉じる' aria-label='駅情報を閉じる' onClick={()=>setSelected(null)}><X size={17}/></button><strong>{chosen.name}</strong>{chosen.names.length>1 && <small>{chosen.names.join(' / ')}</small>}<span>{chosen.routes.map(id=>routes.find(r=>r.id===id).name).join('・')}</span></div>}
        {error && <p role='alert' className={styles.error}>{error}</p>}
      </section>
    </div>
  </main>;
}
