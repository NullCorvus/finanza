import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Wallet,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Save,
  Info,
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { GLOSARIO } from './glosario';

const SUBSIDY_LUMP = 1306119;
const RATE_EA = 0.1456;
const MONTHLY_RATE = 0.0114; // 1.14% monthly

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val);
};

const AccordionItem = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-700">
      <button
        className="w-full py-4 flex justify-between items-center text-left hover:text-primary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{title}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className="pb-4 text-slate-400 text-sm leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching config:", err));
  }, []);

  const handleGlobalChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      global_config: { ...prev.global_config, [key]: value }
    }));
  };

  const handleGastoChange = (id, value) => {
    setConfig(prev => ({
      ...prev,
      gastos: prev.gastos.map(g => g.id === id ? { ...g, current_value: value } : g)
    }));
  };

  const saveToDatabase = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert("Configuración guardada exitosamente");
      }
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-200 uppercase tracking-widest text-xs">Iniciando simulador 2026...</div>;

  const { global_config, gastos } = config;

  // Logic derived from config
  const finSems = Math.max(1, global_config.semestre_fin - global_config.semestre_inicio + 1);
  const fdsPerMonth = [0, 233452, 233452, 466904][global_config.fds_option];
  const totalMonthlyExp = gastos.reduce((sum, g) => sum + g.current_value, 0);
  const quota30 = global_config.icetex_active ? global_config.icetex_credit * 0.30 : 0;

  // Month calculation
  const months = [];
  let running = 0;
  for (let m = 1; m <= 6; m++) {
    const isVac = m <= 2;
    const incVac = isVac ? global_config.vacation_income : 0;
    const incIcetex = (m === 1 && global_config.icetex_active) ? global_config.icetex_credit : 0;
    const incSubsidy = (m === 1 && global_config.subsidy_active) ? SUBSIDY_LUMP : 0;
    const incFds = !isVac ? fdsPerMonth : 0;
    const creditPay = (m === 1 && global_config.icetex_active) ? quota30 : 0;

    const totalIn = incVac + incIcetex + incSubsidy + incFds;
    const totalOut = totalMonthlyExp + creditPay;
    const prevRunning = running;
    running += totalIn - totalOut;

    let statusType = 'ok';
    let statusMsg = 'Mes cubierto';
    if (totalIn < totalOut) {
        if (running >= 0) {
            statusType = 'warning';
            statusMsg = `Usando ahorros — gastando ${formatCurrency(totalOut - totalIn)} del colchón`;
        } else {
            statusType = 'danger';
            statusMsg = `Déficit — te falta ${formatCurrency(Math.abs(running))}`;
        }
    }

    months.push({
      m, isVac, totalIn, totalOut, running, statusType, statusMsg,
      vacationBuffer: Math.max(0, running),
      breakdown: {
        incomes: [
          { label: 'Trabajo Vacac.', value: incVac },
          { label: 'Desembolso ICETEX', value: incIcetex },
          { label: 'Subsidio Sostenimiento', value: incSubsidy },
          { label: 'Fines de semana', value: incFds }
        ].filter(i => i.value > 0),
        expenses: [
          ...gastos.map(g => ({ label: g.label, value: g.current_value })),
          { label: 'Cuota ICETEX 30%', value: creditPay }
        ].filter(e => e.value > 0)
      }
    });
  }

  const finalBal = months[5].running;
  const totalIncomeSem = months.reduce((s, x) => s + x.totalIn, 0);
  const totalOutSem = months.reduce((s, x) => s + x.totalOut, 0);

  // Post-grad calculation
  // Total financed over the selected range
  const totalF = global_config.icetex_credit * finSems;
  const totalCapitalDeuda = totalF * 0.70;
  // Interest accrues during studies + 6 months grace
  // Simplification: Average time in studies + 6 months
  const avgTimeMonths = (finSems * 6) / 2 + 6;
  const totalInterest = totalCapitalDeuda * MONTHLY_RATE * avgTimeMonths;
  const totalOwed = totalCapitalDeuda + totalInterest;
  const monthlyQuota = totalOwed / global_config.post_grad_term;
  const pctSal = (monthlyQuota / global_config.junior_salary) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Configuration (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
            <h2 className="flex items-center gap-2 text-lg font-bold mb-6 text-white">
              <Calculator className="text-primary" /> CONFIGURACIÓN 2026
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block">Inicio Semestre</label>
                    <select
                      value={global_config.semestre_inicio}
                      onChange={(e) => handleGlobalChange('semestre_inicio', parseInt(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white"
                    >
                      {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>Semestre {i+1}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block">Fin Semestre</label>
                    <select
                      value={global_config.semestre_fin}
                      onChange={(e) => handleGlobalChange('semestre_fin', parseInt(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white"
                    >
                      {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>Semestre {i+1}</option>)}
                    </select>
                 </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block">💼 Gano en vacaciones / mes</label>
                <input
                  type="range" min="500000" max="5000000" step="50000"
                  value={global_config.vacation_income}
                  onChange={(e) => handleGlobalChange('vacation_income', parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="text-right text-sm font-bold mt-1 text-primary">{formatCurrency(global_config.vacation_income)} / mes</div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block">🎓 Salario junior proyectado / mes</label>
                <input
                  type="range" min="1763910" max="4000000" step="50000"
                  value={global_config.junior_salary}
                  onChange={(e) => handleGlobalChange('junior_salary', parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="text-right text-sm font-bold mt-1 text-primary">{formatCurrency(global_config.junior_salary)} / mes</div>
              </div>
            </div>

            <hr className="my-6 border-slate-800" />

            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800/50">
                  <div>
                    <div className="text-sm font-bold">📄 Crédito ICETEX 30%</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-tighter font-bold">Pagas el 30% en vacaciones</div>
                  </div>
                  <input
                    type="checkbox" checked={global_config.icetex_active}
                    onChange={(e) => handleGlobalChange('icetex_active', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 accent-primary"
                  />
               </div>

               {global_config.icetex_active && (
                 <div className="pl-4 border-l-2 border-primary/40 py-1">
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Monto por semestre</label>
                    <input
                      type="range" min="300000" max="3000000" step="50000"
                      value={global_config.icetex_credit}
                      onChange={(e) => handleGlobalChange('icetex_credit', parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="text-right text-sm font-bold mt-1 text-primary">{formatCurrency(global_config.icetex_credit)} / semestre</div>
                 </div>
               )}

               <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800/50">
                  <div>
                    <div className="text-sm font-bold">🏛 Subsidio Sostenimiento</div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Un solo pago de {formatCurrency(SUBSIDY_LUMP)}</div>
                  </div>
                  <input
                    type="checkbox" checked={global_config.subsidy_active}
                    onChange={(e) => handleGlobalChange('subsidy_active', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 accent-primary"
                  />
               </div>

               <div>
                 <label className="text-[10px] text-slate-500 block mb-1 uppercase font-black">📅 Trabajo fines de semana / día</label>
                 <select
                   value={global_config.fds_option}
                   onChange={(e) => handleGlobalChange('fds_option', parseInt(e.target.value))}
                   className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                 >
                    <option value={0}>No trabajo</option>
                    <option value={1}>Sábados ($58.363/día)</option>
                    <option value={2}>Domingos ($58.363/día)</option>
                    <option value={3}>Sábados y Domingos</option>
                 </select>
               </div>
            </div>

            <button
              onClick={saveToDatabase}
              disabled={saving}
              className="w-full mt-8 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary/20 text-xs tracking-widest"
            >
              <Save size={18} /> {saving ? 'GUARDANDO...' : 'GUARDAR POR DEFECTO'}
            </button>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
             <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><DollarSign className="text-primary" size={20}/> GASTOS MENSUALES</h2>
             <div className="space-y-6">
               {gastos.map(g => (
                 <div key={g.id}>
                    <div className="flex justify-between mb-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold">{g.label}</label>
                      <span className="text-xs font-bold text-primary">{formatCurrency(g.current_value)} / mes</span>
                    </div>
                    <input
                      type="range" min={g.min_val} max={g.max_val} step={g.step}
                      value={g.current_value}
                      onChange={(e) => handleGastoChange(g.id, parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: Dashboard (8 cols) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryStat label="Ingresos Semestre" value={formatCurrency(totalIncomeSem)} icon={<ArrowUpRight className="text-blue-400"/>} color="blue" />
            <SummaryStat label="Gastos Semestre" value={formatCurrency(totalOutSem)} icon={<ArrowDownRight className="text-red-400"/>} color="red" />
            <SummaryStat label="Cuota Crédito 30%" value={formatCurrency(quota30)} icon={<DollarSign className="text-amber-400"/>} color="amber" />
            <SummaryStat label="Balance Neto" value={formatCurrency(finalBal)} icon={<Wallet className={finalBal >= 0 ? 'text-success' : 'text-danger'}/>} color={finalBal >= 0 ? 'green' : 'red'} />
          </div>

          {/* Month Cards Grid */}
          <div className="space-y-4">
             <h2 className="text-xl font-black flex items-center gap-2 text-white uppercase tracking-tighter"><Calendar className="text-primary"/> Desglose Mensual del Semestre</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {months.map(m => (
                 <div key={m.m} className={`p-5 rounded-2xl border backdrop-blur-sm transition-all hover:border-primary/50 ${m.isVac ? 'bg-blue-950/20 border-blue-900/30 shadow-inner' : 'bg-slate-900/50 border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${m.isVac ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                            {m.m}
                         </div>
                         <div>
                           <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Mes {m.m}</div>
                           <div className="text-xs font-black flex items-center gap-1 uppercase tracking-widest text-white/90">
                             {m.isVac ? <><Info size={12} className="text-blue-400"/> Vacaciones</> : 'Estudio'}
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                          <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5 tracking-widest">Acumulado</div>
                          <div className={`text-lg font-black ${m.running >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(m.running)}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                          <div className="text-[9px] text-slate-500 uppercase font-bold mb-2 tracking-widest flex justify-between">
                            <span>Ingresos</span>
                            <span className="text-blue-400">{formatCurrency(m.totalIn)}</span>
                          </div>
                          {m.breakdown.incomes.map((inc, i) => (
                            <div key={i} className="flex justify-between text-[11px] py-0.5">
                               <span className="text-slate-400">{inc.label}</span>
                               <span className="text-blue-300">+{formatCurrency(inc.value)}</span>
                            </div>
                          ))}
                       </div>
                       <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                          <div className="text-[9px] text-slate-500 uppercase font-bold mb-2 tracking-widest flex justify-between">
                            <span>Gastos</span>
                            <span className="text-red-400">{formatCurrency(m.totalOut)}</span>
                          </div>
                          {m.breakdown.expenses.map((exp, i) => (
                            <div key={i} className="flex justify-between text-[11px] py-0.5">
                               <span className="text-slate-400">{exp.label}</span>
                               <span className="text-red-300">-{formatCurrency(exp.value)}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                       <div className="flex items-center gap-2">
                          {m.statusType === 'ok' ? <CheckCircle2 size={14} className="text-success" /> :
                           m.statusType === 'warning' ? <AlertCircle size={14} className="text-warning" /> :
                           <XCircle size={14} className="text-danger" />}
                          <span className={`text-[11px] font-bold ${m.statusType === 'ok' ? 'text-success' : m.statusType === 'warning' ? 'text-warning' : 'text-danger'}`}>
                            {m.statusMsg}
                          </span>
                       </div>
                       {!m.isVac && m.breakdown.incomes.length === 0 && (
                         <div className="text-[10px] text-slate-500 italic bg-slate-800/50 p-2 rounded-lg">
                           Sin ingresos este mes — financiado con el colchón de vacaciones ({formatCurrency(m.vacationBuffer)} disponible)
                         </div>
                       )}
                    </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Post-Graduation Section */}
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <GraduationCap size={150}/>
             </div>
             <h2 className="text-xl font-black mb-8 flex items-center gap-2 text-white uppercase tracking-tighter"><TrendingUp className="text-primary"/> Etapa de Pago Post-grado (2026+)</h2>

             <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                <div className="md:col-span-7 space-y-6">
                   <MetricRow label={`Sems. Financiados (${global_config.semestre_inicio} a ${global_config.semestre_fin})`} value={finSems} color="text-slate-200" />
                   <MetricRow label="Capital Financiado (70%)" value={formatCurrency(totalCapitalDeuda)} color="text-slate-200" />
                   <MetricRow label="Intereses Causados (Estudios + 6 meses)" value={formatCurrency(totalInterest)} color="text-red-400" />
                   <MetricRow label="Deuda Total al Empezar Pagos" value={formatCurrency(totalOwed)} color="text-red-500" bold />

                   <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 flex justify-between items-center shadow-inner">
                      <div className="flex items-center gap-4">
                         <div className="bg-primary/20 p-3 rounded-xl text-primary shadow-lg shadow-primary/10">
                            <Clock size={24}/>
                         </div>
                         <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Plazo Elegido</div>
                            <input
                              type="range" min="12" max="72" step="12"
                              value={global_config.post_grad_term}
                              onChange={(e) => handleGlobalChange('post_grad_term', parseInt(e.target.value))}
                              className="w-32 accent-primary"
                            />
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xl font-black text-white">{global_config.post_grad_term} meses</div>
                         <div className="text-[10px] text-slate-500 uppercase font-bold">{global_config.post_grad_term / 12} años</div>
                      </div>
                   </div>
                   <p className="text-[9px] text-slate-500 italic uppercase font-bold border-l-2 border-slate-700 pl-3">
                     * El plazo predeterminado es 1.5x semestres financiados, ajustable de 1 a 6 años.
                   </p>
                </div>

                <div className="md:col-span-5 p-8 bg-slate-800/40 rounded-3xl border border-slate-700/50 text-center relative shadow-inner">
                   <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-4">Cuota Mensual Proyectada</div>
                   <div className="text-4xl font-black text-primary mb-1 drop-shadow-lg">{formatCurrency(monthlyQuota)}</div>
                   <div className="text-[10px] text-slate-500 mb-8 font-bold uppercase tracking-widest">durante {global_config.post_grad_term} meses / {global_config.post_grad_term / 12} años</div>

                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] uppercase font-black text-slate-400 px-1">
                         <span>Esfuerzo Salarial</span>
                         <span className={pctSal <= 15 ? 'text-success' : pctSal <= 25 ? 'text-warning' : 'text-danger'}>{Math.round(pctSal)}%</span>
                      </div>
                      <div className="h-4 bg-black/40 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                         <div
                           className={`h-full rounded-full transition-all duration-700 ${pctSal <= 15 ? 'bg-success' : pctSal <= 25 ? 'bg-warning' : 'bg-danger'}`}
                           style={{width: `${Math.min(pctSal, 100)}%`}}
                         ></div>
                      </div>
                   </div>

                   <div className="mt-8 p-4 rounded-2xl bg-black/20 text-[11px] text-slate-400 leading-relaxed italic border border-white/5 font-medium">
                      {pctSal <= 15 ? (
                        <span className="text-success flex items-center gap-2 justify-center not-italic font-black uppercase tracking-tighter">
                          <CheckCircle2 size={14}/> Cuota muy cómoda. Te sobran {formatCurrency(global_config.junior_salary - monthlyQuota)}/mes.
                        </span>
                      ) : pctSal <= 25 ? (
                        <span className="text-warning flex items-center gap-2 justify-center not-italic font-black uppercase tracking-tighter">
                          <AlertCircle size={14}/> Manejable, pero ajustado.
                        </span>
                      ) : (
                        <span className="text-danger flex items-center gap-2 justify-center not-italic font-black uppercase tracking-tighter">
                          <XCircle size={14}/> Cuota alta. Recomendamos buscar condonación.
                        </span>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* Glossary Section */}
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-xl">
             <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter text-white"><Info className="text-primary"/> Glosario y Ayuda Teórica 2026-2</h2>
             <div className="divide-y divide-slate-800">
               {GLOSARIO.map((item, idx) => (
                 <AccordionItem key={idx} title={item.title} content={item.content} />
               ))}
             </div>
          </div>

        </div>
      </div>

      <div className="mt-12 text-center pb-8 border-t border-slate-800/50 pt-8">
        <p className="text-[10px] text-slate-600 max-w-3xl mx-auto italic leading-relaxed uppercase tracking-widest font-bold">
          * Datos verificados 2026: Tasa 14.56% EA (IPC 5.10% + 9%). Subsidio lump sum $1,306,119. Salario mínimo $1,750,905.
          Los valores son proyecciones ilustrativas basadas en las condiciones de la convocatoria 2026-2.
        </p>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, icon, color }) {
  const colorMap = {
    blue: 'bg-blue-500/5 border-blue-500/20 text-blue-400',
    red: 'bg-red-500/5 border-red-500/20 text-red-400',
    amber: 'bg-amber-500/5 border-amber-500/20 text-amber-400',
    green: 'bg-success/5 border-success/20 text-success'
  };
  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color] || colorMap.blue} flex flex-col items-center justify-center text-center shadow-sm`}>
      <div className="p-2 rounded-full mb-2 bg-white/5">{icon}</div>
      <div className="text-[9px] uppercase font-black tracking-widest opacity-60 mb-1">{label}</div>
      <div className="text-base font-black truncate w-full">{value}</div>
    </div>
  );
}

function MetricRow({ label, value, color, bold = false }) {
  return (
    <div className="flex justify-between items-end border-b border-white/5 pb-2">
      <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">{label}</span>
      <span className={`text-sm font-black ${color} ${bold ? 'text-lg' : ''}`}>{value}</span>
    </div>
  );
}
