import React, { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, CheckCircle2, Clock, Calendar, Building2, Activity } from 'lucide-react'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v)

const EMPRESAS = [
  { id:'dw', nome:'Doctor Wealth', cor:'#3b82f6', corBg:'rgba(59,130,246,0.08)', status:'Crescimento', statusCor:'#10b981', fat:48500, meta:60000, rec:38000, cli:47, cliMeta:60, inadim:3.2, cresc:18.4, result:22000,
    fluxo:[{m:'Out',r:32000,d:28000},{m:'Nov',r:35000,d:30000},{m:'Dez',r:38000,d:33000},{m:'Jan',r:41000,d:35000},{m:'Fev',r:44000,d:36000},{m:'Mar',r:48500,d:38000}],
    tarefas:[{t:'Finalizar pitch para 3 clínicas',p:'alta',ok:false},{t:'Onboarding 2 médicos novos',p:'alta',ok:false},{t:'Enviar proposta Dr. Marcos',p:'media',ok:false},{t:'Calendário Instagram Abril',p:'baixa',ok:true}],
    kpis:[{l:'Clientes',v:'47/60'},{l:'Recorrência',v:'R$ 38k'},{l:'Inadimplência',v:'3,2%'},{l:'Ticket Médio',v:'R$ 1.031'}]
  },
  { id:'of', nome:'Original Fotografia', cor:'#f59e0b', corBg:'rgba(245,158,11,0.08)', status:'Turnaround', statusCor:'#f59e0b', fat:28000, meta:35000, rec:12000, cli:22, cliMeta:30, inadim:8.7, cresc:-4.2, result:4200,
    fluxo:[{m:'Out',r:31000,d:27000},{m:'Nov',r:33000,d:29000},{m:'Dez',r:36000,d:34000},{m:'Jan',r:29000,d:26000},{m:'Fev',r:27000,d:24000},{m:'Mar',r:28000,d:25000}],
    tarefas:[{t:'Revisar contratos inadimplentes',p:'alta',ok:false},{t:'Reunião equipe — corte de custos',p:'alta',ok:false},{t:'Calendário de ensaios Q2',p:'media',ok:false},{t:'Cobranças — 3 clientes',p:'alta',ok:false}],
    kpis:[{l:'Clientes',v:'22/30'},{l:'Recorrência',v:'R$ 12k'},{l:'Inadimplência',v:'8,7%'},{l:'Ticket Médio',v:'R$ 1.272'}]
  },
  { id:'fs', nome:'Forme Seguro', cor:'#8b5cf6', corBg:'rgba(139,92,246,0.08)', status:'Lançamento', statusCor:'#06b6d4', fat:15000, meta:50000, rec:15000, cli:3, cliMeta:12, inadim:0, cresc:0, result:8500,
    fluxo:[{m:'Out',r:0,d:0},{m:'Nov',r:0,d:0},{m:'Dez',r:0,d:0},{m:'Jan',r:5000,d:3000},{m:'Fev',r:10000,d:6000},{m:'Mar',r:15000,d:8000}],
    tarefas:[{t:'Fechar UNIFENAS — Medicina 2026',p:'alta',ok:false},{t:'Proposta para UNIFAL',p:'alta',ok:false},{t:'Configurar agente IA WhatsApp',p:'media',ok:false},{t:'Planilha fundos ativos',p:'media',ok:true}],
    kpis:[{l:'Fundos Ativos',v:'3 fundos'},{l:'Val. Gerenciado',v:'R$ 420k'},{l:'Inadimplência',v:'0%'},{l:'Pipeline',v:'5 turmas'}]
  }
]

const AGENDA = [
  {h:'09:00',t:'Call Doctor Wealth — Dr. Felipe',cor:'#3b82f6'},
  {h:'11:00',t:'Reunião CDL — Networking',cor:'#6b7280'},
  {h:'14:30',t:'Revisão Financeira Fotografia',cor:'#f59e0b'},
  {h:'16:00',t:'Prospecção Forme — UNIFENAS',cor:'#8b5cf6'},
]

const Card = ({children,style={}}) => <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:24,...style}}>{children}</div>
const Label = ({children}) => <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>{children}</p>
const TT = ({active,payload}) => !active||!payload?.length?null:<div style={{background:'#1a2035',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 14px',fontSize:12}}><p style={{color:'#10b981'}}>Rec: {fmt(payload[0]?.value||0)}</p><p style={{color:'#ef4444'}}>Desp: {fmt(payload[1]?.value||0)}</p></div>

export default function App() {
  const [emp, setEmp] = useState('dw')
  const e = EMPRESAS.find(x=>x.id===emp)
  const totalFat = EMPRESAS.reduce((s,x)=>s+x.fat,0)
  const pieData = EMPRESAS.map(x=>({name:x.nome,value:x.fat,cor:x.cor}))

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div style={{borderBottom:'1px solid var(--border)',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,background:'rgba(10,13,20,0.95)',backdropFilter:'blur(12px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center'}}><Activity size={16} color="white"/></div>
          <div><p style={{fontSize:15,fontFamily:'Syne',fontWeight:800}}>MAXXXI</p><p style={{fontSize:10,color:'var(--muted)',marginTop:-2}}>Dashboard Executivo</p></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:8,height:8,borderRadius:'50%',background:'#10b981'}}/><span style={{fontSize:11,color:'var(--muted)'}}>Março 2026</span></div>
      </div>
      <div style={{padding:'28px 32px',maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
          {[{l:'Faturamento Total',v:fmt(totalFat),d:8.2,cor:'#3b82f6'},{l:'Resultado Consolid.',v:fmt(34700),d:12.1,cor:'#10b981'},{l:'Clientes Ativos',v:'72',d:6.5,cor:'#f59e0b'},{l:'Empresas Ativas',v:'3',cor:'#8b5cf6'}].map((k,i)=>(
            <Card key={i}><Label>{k.l}</Label><p style={{fontSize:28,fontFamily:'Syne',fontWeight:800,color:k.cor}}>{k.v}</p>{k.d&&<p style={{fontSize:12,color:'#10b981',marginTop:4}}>▲ +{k.d}% vs mês ant.</p>}</Card>
          ))}
        </div>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--muted)',marginBottom:12}}>Empresas do Ecossistema</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28}}>
          {EMPRESAS.map(x=>{
            const pct=Math.min((x.fat/x.meta)*100,100).toFixed(0)
            const ativo=emp===x.id
            return <div key={x.id} onClick={()=>setEmp(x.id)} style={{background:ativo?x.corBg:'var(--surface)',border:`${ativo?2:1}px solid ${ativo?x.cor:'var(--border)'}`,borderRadius:16,padding:20,cursor:'pointer',position:'relative',overflow:'hidden'}}>
              {ativo&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:x.cor}}/>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div><p style={{fontSize:13,fontFamily:'Syne',fontWeight:700,marginBottom:4}}>{x.nome}</p><span style={{fontSize:10,fontWeight:600,textTransform:'uppercase',color:x.statusCor,background:`${x.statusCor}18`,padding:'2px 8px',borderRadius:999}}>{x.status}</span></div>
                <div style={{textAlign:'right'}}><p style={{fontSize:18,fontFamily:'Syne',fontWeight:700,color:x.cor}}>{fmt(x.fat)}</p><p style={{fontSize:11,color:x.cresc>=0?'#10b981':'#ef4444'}}>{x.cresc>=0?'▲':'▼'} {Math.abs(x.cresc)}%</p></div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--muted)',marginBottom:4}}><span>{fmt(x.fat)}</span><span>Meta {fmt(x.meta)}</span></div>
              <div style={{background:'rgba(255,255,255,0.06)',borderRadius:999,height:6,overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',background:x.cor,borderRadius:999}}/></div>
            </div>
          })}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:28}}>
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div><Label>Fluxo de Caixa</Label><p style={{fontSize:15,fontFamily:'Syne',fontWeight:700,color:e.cor}}>{e.nome}</p></div>
              <div style={{display:'flex',gap:16,fontSize:11}}><span style={{color:'#10b981'}}>■ Receita</span><span style={{color:'#ef4444'}}>■ Despesa</span></div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={e.fluxo}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                </defs>
                <XAxis dataKey="m" tick={{fontSize:11,fill:'#6b7280'}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="r" stroke="#10b981" strokeWidth={2} fill="url(#gR)"/>
                <Area type="monotone" dataKey="d" stroke="#ef4444" strokeWidth={2} fill="url(#gD)"/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <Label>Indicadores — {e.nome}</Label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:12}}>
              {e.kpis.map((k,i)=><div key={i}><Label>{k.l}</Label><p style={{fontSize:22,fontFamily:'Syne',fontWeight:700,color:e.cor}}>{k.v}</p></div>)}
            </div>
          </Card>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20,marginBottom:28}}>
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div><Label>Próximas Ações</Label><p style={{fontSize:14,fontFamily:'Syne',fontWeight:700,color:e.cor}}>{e.nome}</p></div>
              <span style={{fontSize:11,color:'var(--muted)'}}>{e.tarefas.filter(t=>!t.ok).length} pendentes</span>
            </div>
            {e.tarefas.map((t,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:t.ok?'rgba(16,185,129,0.05)':'var(--surface2)',borderRadius:10,border:`1px solid ${t.ok?'rgba(16,185,129,0.2)':'var(--border)'}`,marginBottom:8}}>
              {t.ok?<CheckCircle2 size={16} color="#10b981"/>:t.p==='alta'?<AlertCircle size={16} color="#ef4444"/>:<Clock size={16} color="#f59e0b"/>}
              <span style={{flex:1,fontSize:13,textDecoration:t.ok?'line-through':'none',color:t.ok?'var(--muted)':'var(--text)'}}>{t.t}</span>
              {!t.ok&&<span style={{fontSize:10,fontWeight:600,textTransform:'uppercase',padding:'2px 8px',borderRadius:999,background:t.p==='alta'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)',color:t.p==='alta'?'#ef4444':'#f59e0b'}}>{t.p}</span>}
            </div>)}
          </Card>
          <Card>
            <Label>Distribuição de Receita</Label>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">{pieData.map((x,i)=><Cell key={i} fill={x.cor}/>)}</Pie><Tooltip formatter={(v)=>fmt(v)}/></PieChart>
            </ResponsiveContainer>
            {EMPRESAS.map(x=><div key={x.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:8,height:8,borderRadius:2,background:x.cor}}/><span style={{fontSize:12}}>{x.nome}</span></div><span style={{fontSize:12,fontFamily:'Syne',fontWeight:700,color:x.cor}}>{((x.fat/totalFat)*100).toFixed(0)}%</span></div>)}
          </Card>
        </div>
        <Card style={{padding:'16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><Calendar size={14} color="var(--muted)"/><Label>Agenda do Dia</Label></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {AGENDA.map((a,i)=><div key={i} style={{display:'flex',gap:10,padding:'10px 12px',background:'var(--surface2)',borderRadius:10,borderLeft:`3px solid ${a.cor}`}}><span style={{fontSize:11,color:'var(--muted)',fontFamily:'Syne',fontWeight:700,minWidth:40}}>{a.h}</span><span style={{fontSize:12,lineHeight:1.3}}>{a.t}</span></div>)}
          </div>
        </Card>
      </div>
    </div>
  )
}