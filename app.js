const $=id=>document.getElementById(id);
const API='https://api.open-meteo.com/v1/forecast';
const defaults={lat:38.722,lon:-27.220,name:'Angra do Heroísmo'};
let lat=defaults.lat,lon=defaults.lon,locationName=defaults.name,lastPressure=[];
const weatherText={0:'Céu limpo',1:'Maioritariamente limpo',2:'Parcialmente nublado',3:'Encoberto',45:'Nevoeiro',48:'Nevoeiro com geada',51:'Chuvisco ligeiro',53:'Chuvisco moderado',55:'Chuvisco intenso',56:'Chuvisco gelado',57:'Chuvisco gelado intenso',61:'Chuva ligeira',63:'Chuva moderada',65:'Chuva forte',66:'Chuva gelada',67:'Chuva gelada forte',71:'Neve ligeira',73:'Neve moderada',75:'Neve forte',77:'Grãos de neve',80:'Aguaceiros ligeiros',81:'Aguaceiros moderados',82:'Aguaceiros fortes',85:'Aguaceiros de neve',86:'Aguaceiros de neve fortes',95:'Trovoada',96:'Trovoada com granizo',99:'Trovoada forte com granizo'};
const icons={0:'☼',1:'🌤',2:'⛅',3:'☁',45:'≋',48:'≋',51:'☂',53:'☂',55:'☂',61:'☂',63:'☔',65:'☔',80:'🌦',81:'🌧',82:'🌧',95:'ϟ',96:'ϟ',99:'ϟ'};
const directions=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
function dir(deg){return directions[Math.round(deg/22.5)%16]||'—'}
function time(s){if(!s)return'—';return new Intl.DateTimeFormat('pt-PT',{hour:'2-digit',minute:'2-digit',timeZone:'Atlantic/Azores'}).format(new Date(s))}
function dateLabel(s,opts={weekday:'short',day:'2-digit',month:'short'}){return new Intl.DateTimeFormat('pt-PT',{...opts,timeZone:'Atlantic/Azores'}).format(new Date(s+'T12:00:00'))}
function moonInfo(date=new Date()){
 const syn=29.530588853, known=Date.UTC(2000,0,6,18,14), age=((date.getTime()-known)/86400000%syn+syn)%syn, frac=age/syn, illum=(1-Math.cos(2*Math.PI*frac))/2;
 const names=['Lua nova','Lua crescente','Quarto crescente','Lua gibosa crescente','Lua cheia','Lua gibosa minguante','Quarto minguante','Lua minguante'];
 const idx=Math.round(frac*8)%8; const symbols=['●','◔','◑','◕','○','◕','◑','◔'];
 return {age,illum,name:names[idx],symbol:symbols[idx]};
}
function solunar(date){
 // Estimativa de janelas centradas em trânsitos lunares aproximados; não substitui efemérides precisas.
 const m=moonInfo(date), dayOfYear=Math.floor((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(date.getFullYear(),0,0))/86400000);
 const transit=((12.2 + m.age*0.8 + dayOfYear*0.065)%24+24)%24;
 const fmt=h=>{h=(h+24)%24;return String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor((h%1)*60)).padStart(2,'0')};
 return {major1:fmt(transit-1),major2:fmt(transit+1),minor1:fmt(transit-6.2),minor2:fmt(transit+6.2)};
}
function updateMoon(daily){
 const m=moonInfo();$('moonPhase').textContent=m.name;$('moonIcon').textContent=m.symbol;$('moonIllum').textContent=`Iluminação: ${Math.round(m.illum*100)}%`;$('moonAge').textContent=`Idade lunar: ${m.age.toFixed(1)} dias`;
 const s=solunar(new Date());for(const k of ['major1','major2','minor1','minor2'])$(k).textContent=s[k];
 $('sunrise').textContent=time(daily.sunrise?.[0]);$('sunset').textContent=time(daily.sunset?.[0]);
}
async function loadWeather(){
 $('updated').textContent='A atualizar instrumentos…';
 const params=new URLSearchParams({latitude:lat,longitude:lon,timezone:'Atlantic/Azores',forecast_days:'7',
 current:'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
 hourly:'temperature_2m,precipitation,precipitation_probability,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,relative_humidity_2m',
 daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max,uv_index_max,sunrise,sunset'});
 try{
  const r=await fetch(API+'?'+params);if(!r.ok)throw Error('API meteorológica respondeu '+r.status);const d=await r.json();
  const c=d.current, h=d.hourly, day=d.daily;
  $('temp').textContent=Math.round(c.temperature_2m)+'°C';$('summary').textContent=weatherText[c.weather_code]||'Condição variável';$('feels').textContent=Math.round(c.apparent_temperature)+'°C';
  $('precip').textContent=(c.precipitation??0).toFixed(1)+' mm';$('rainprob').textContent='próxima hora: '+(h.precipitation_probability?.[Math.max(0,h.time.findIndex(t=>t>=c.time))]??'—')+'%';
  $('wind').textContent=Math.round(c.wind_speed_10m)+' km/h';$('winddir').textContent=dir(c.wind_direction_10m)+' · '+Math.round(c.wind_direction_10m)+'°';
  $('humidity').textContent=c.relative_humidity_2m+'%';$('cloud').textContent=c.cloud_cover+'%';$('gust').textContent=Math.round(c.wind_gusts_10m)+' km/h';$('uv').textContent=day.uv_index_max?.[0]?.toFixed(1)??'—';
  $('pressure').textContent=Math.round(c.pressure_msl);const pidx=h.time.findIndex(t=>t>=c.time);const pnow=c.pressure_msl;const past=h.pressure_msl[Math.max(0,pidx-3)]??pnow;const delta=pnow-past;
  $('trend').textContent=Math.abs(delta)<0.8?'A manter':delta>0?'A subir':'A descer';$('trendIcon').textContent=Math.abs(delta)<0.8?'→':delta>0?'↗':'↘';$('trendIcon').style.color=Math.abs(delta)<0.8?'#c59a52':delta>0?'#8ba78a':'#cf8062';
  $('needle').style.transform=`rotate(${Math.max(-75,Math.min(75,(c.pressure_msl-1013)*3))}deg)`;
  $('days').innerHTML=day.time.map((dt,i)=>`<div class="day"><div class="date">${i===0?'HOJE':dateLabel(dt).toUpperCase()}</div><div class="weather-icon">${icons[day.weather_code[i]]||'☁'}</div><div class="desc">${weatherText[day.weather_code[i]]||'Variável'}</div><div class="temps">${Math.round(day.temperature_2m_max[i])}° <span style="color:#9d8b70">${Math.round(day.temperature_2m_min[i])}°</span></div><div class="rain">☂ ${day.precipitation_sum[i]?.toFixed(1)??'—'} mm · ${day.precipitation_probability_max[i]??'—'}%</div><div class="windday">↗ ${Math.round(day.wind_speed_10m_max[i])} km/h ${dir(day.wind_direction_10m_dominant[i])}</div></div>`).join('');
  const start=Math.max(0,h.time.findIndex(t=>t>=c.time));$('hours').innerHTML=h.time.slice(start,start+24).map((dt,j)=>{const i=start+j;return `<div class="hour"><span>${time(dt)}</span><b>${icons[h.weather_code[i]]||'☁'} ${Math.round(h.temperature_2m[i])}°</b><small>☂ ${h.precipitation[i]?.toFixed(1)} mm</small><small>Prob. ${h.precipitation_probability[i]??'—'}%</small><small>↗ ${Math.round(h.wind_speed_10m[i])} km/h ${dir(h.wind_direction_10m[i])}</small></div>`}).join('');
  updateMoon(day);$('updated').textContent='Atualizado '+time(c.time)+' · '+locationName;
  await loadTides();
 }catch(e){$('updated').textContent='Erro ao obter dados: '+e.message}
}
async function loadTides(){
 $('tideNote').textContent='A consultar o serviço de marés para este ponto. A cobertura na Terceira pode ser limitada.';
 $('highTide').textContent='Não disponível';$('lowTide').textContent='Não disponível';$('harmonics').textContent='Sem dados harmónicos disponíveis.';$('tideStation').textContent='Open Waters API';
 try{
  const url=`https://api.openwaters.io/tides/extremes?latitude=${lat}&longitude=${lon}`;
  const r=await fetch(url);if(!r.ok)throw Error('sem estação ou serviço indisponível');const data=await r.json();
  const rows=Array.isArray(data)?data:(data.extremes||data.predictions||data.data||[]);
  if(!rows.length)throw Error('não foram devolvidas previsões para estas coordenadas');
  const sorted=rows.map(x=>({time:x.time||x.datetime||x.timestamp,type:(x.type||x.kind||x.event||'').toLowerCase(),height:x.height??x.height_m??x.value})).filter(x=>x.time).sort((a,b)=>new Date(a.time)-new Date(b.time));
  const high=sorted.find(x=>/high|high.?tide|preia|máxima/.test(x.type)),low=sorted.find(x=>/low|low.?tide|baixa|mínima/.test(x.type));
  if(high)$('highTide').textContent=`${time(high.time)} · ${high.height==null?'altura n/d':Number(high.height).toFixed(2)+' m'}`;
  if(low)$('lowTide').textContent=`${time(low.time)} · ${low.height==null?'altura n/d':Number(low.height).toFixed(2)+' m'}`;
  $('tideNote').textContent='Foram recebidos dados de maré. Confirme a estação de referência, o fuso horário e o datum vertical antes de utilizar os valores.';
  $('tideStation').textContent=data.station?.name||data.station_name||'Estação mais próxima';
 }catch(e){$('tideNote').textContent='Não foi possível confirmar previsões harmónicas de maré para este ponto. Isto não significa ausência de maré: pode não existir estação/modelo com cobertura suficiente. Consulte as Tabelas de Marés do Instituto Hidrográfico.'}
}
function setLocation(value,name){
 const p=value.split(',');lat=Number(p[0]);lon=Number(p[1]);locationName=name;
 localStorage.setItem('terceiraLocation',JSON.stringify({value,name}));loadWeather();
}
$('place').addEventListener('change',e=>{if(e.target.value==='custom'){$('customBox').hidden=false;return}$('customBox').hidden=true;setLocation(e.target.value,e.target.selectedOptions[0].text)});
$('goCustom').addEventListener('click',()=>{const a=Number($('lat').value),b=Number($('lon').value);if(!Number.isFinite(a)||!Number.isFinite(b)||a<38.5||a>39||b<-27.6||b>-26.8){alert('Introduza coordenadas válidas da ilha Terceira (lat. 38,5–39,0; lon. −27,6 a −26,8).');return}setLocation(`${a},${b}`,'Coordenadas personalizadas')});
$('refresh').addEventListener('click',loadWeather);
function tick(){$('clock').textContent=new Intl.DateTimeFormat('pt-PT',{timeZone:'Atlantic/Azores',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())}
const saved=localStorage.getItem('terceiraLocation');if(saved){try{const s=JSON.parse(saved);const opt=[...$('place').options].find(o=>o.value===s.value);if(opt){$('place').value=s.value;locationName=opt.text}else{$('place').value='custom';$('customBox').hidden=false;$('lat').value=s.value.split(',')[0];$('lon').value=s.value.split(',')[1];locationName=s.name}lat=Number(s.value.split(',')[0]);lon=Number(s.value.split(',')[1]);}catch{}}
tick();setInterval(tick,1000);loadWeather();setInterval(loadWeather,30*60*1000);
