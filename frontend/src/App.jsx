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
  ArrowDownRight
} from 'lucide-react';
import { GLOSARIO } from './glosario';

const SUBSIDY = 1306119;
const RATE = 0.1456;
const FIN_SEMS = 4;
const POST_SEMS = 6;
const FDS_INCOME = [0, 233452, 233452, 466904];

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

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val);
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

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-200">Cargando...</div>;

  const { global_config, gastos } = config;
  const totalMonthlyExp = gastos.reduce((sum, g) => sum + g.current_value, 0);
  const quota30 = global_config.icetex_active ? global_config.icetex_credit * 0.30 : 0;
  const subsidyPerMonth = global_config.subsidy_active ? SUBSIDY / 6 : 0;
  const fdsPerMonth = FDS_INCOME[global_config.fds_option];

  // Logic for 6 months
  const months = [];
  let running = 0;
  for (let m = 1; m <= 6; m++) {
    const isVac = m <= 2;
    const incVac = isVac ? global_config.vacation_income : 0;
    const incIcetex = (m === 1 && global_config.icetex_active) ? global_config.icetex_credit : 0;
    const incSubsidy = !isVac ? subsidyPerMonth : 0;
    const incFds = !isVac ? fdsPerMonth : 0;
    const creditPay = (m === 1 && global_config.icetex_active) ? quota30 : 0;

    const totalIn = incVac + incIcetex + incSubsidy + incFds;
    const totalOut = totalMonthlyExp + creditPay;
    running += totalIn - totalOut;

    months.push({
      m,
      isVac,
      totalIn,
      totalOut,
      running,
      coverage: (totalIn / (totalOut || 1)) * 100,
      breakdown: {
        incomes: [
          { label: 'Trabajo Vacac.', value: incVac },
          { label: 'Crédito ICETEX', value: incIcetex },
          { label: 'Subsidio', value: incSubsidy },
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

  // Post-grad
  const totalF = global_config.icetex_credit * FIN_SEMS;
  const totalD = totalF * 0.7;
  const interest = totalF * RATE * (FIN_SEMS * 0.5);
  const totalOwed = totalD + interest;
  const paymentMonths = POST_SEMS * 6;
  const monthlyQuota = totalOwed / paymentMonths;
  const pctSal = (monthlyQuota / global_config.junior_salary) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Configuration (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-6">
              <Calculator className="text-primary" /> Configuración Base
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                  💼 Gano en vacaciones / mes
                </label>
                <input
                  type="range" min="500000" max="5000000" step="50000"
                  value={global_config.vacation_income}
                  onChange={(e) => handleGlobalChange('vacation_income', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-sm font-medium mt-1 text-primary">{formatCurrency(global_config.vacation_income)} / mes</div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                  🎓 Salario junior proyectado
                </label>
                <input
                  type="range" min="1763910" max="4000000" step="50000"
                  value={global_config.junior_salary}
                  onChange={(e) => handleGlobalChange('junior_salary', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-sm font-medium mt-1 text-primary">{formatCurrency(global_config.junior_salary)} / mes</div>
              </div>
            </div>

            <hr className="my-6 border-slate-800" />

            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <div className="text-sm font-medium">📄 Crédito ICETEX 30%</div>
                    <div className="text-[10px] text-slate-500 uppercase">Pagas el 30% en vacaciones</div>
                  </div>
                  <input
                    type="checkbox" checked={global_config.icetex_active}
                    onChange={(e) => handleGlobalChange('icetex_active', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 accent-primary"
                  />
               </div>

               {global_config.icetex_active && (
                 <div className="pl-4 border-l-2 border-primary/30 py-1">
                    <label className="text-xs text-slate-400 block mb-1 uppercase tracking-tighter">Monto por semestre</label>
                    <input
                      type="range" min="300000" max="3000000" step="50000"
                      value={global_config.icetex_credit}
                      onChange={(e) => handleGlobalChange('icetex_credit', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-right text-sm font-medium mt-1 text-primary">{formatCurrency(global_config.icetex_credit)} / semestre</div>
                 </div>
               )}

               <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <div className="text-sm font-medium">🏛 Subsidio Sostenimiento</div>
                    <div className="text-[10px] text-slate-500 uppercase">Solo Sisbén A, B, C1–C7</div>
                  </div>
                  <input
                    type="checkbox" checked={global_config.subsidy_active}
                    onChange={(e) => handleGlobalChange('subsidy_active', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 accent-primary"
                  />
               </div>

               <div>
                 <label className="text-xs text-slate-400 block mb-1 uppercase tracking-tighter">📅 Trabajo fines de semana</label>
                 <select
                   value={global_config.fds_option}
                   onChange={(e) => handleGlobalChange('fds_option', parseInt(e.target.value))}
                   className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                 >
                    <option value={0}>No trabajo</option>
                    <option value={1}>Sábados</option>
                    <option value={2}>Domingos</option>
                    <option value={3}>Sábados y Domingos</option>
                 </select>
               </div>
            </div>

            <button
              onClick={saveToDatabase}
              disabled={saving}
              className="w-full mt-8 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Save size={18} /> {saving ? 'Guardando...' : 'Guardar por Defecto'}
            </button>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><DollarSign className="text-primary" size={20}/> Gastos Mensuales</h2>
             <div className="space-y-6">
               {gastos.map(g => (
                 <div key={g.id}>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-slate-400 uppercase tracking-tighter">{g.label}</label>
                      <span className="text-xs font-bold text-primary">{formatCurrency(g.current_value)} / mes</span>
                    </div>
                    <input
                      type="range" min={g.min_val} max={g.max_val} step={g.step}
                      value={g.current_value}
                      onChange={(e) => handleGastoChange(g.id, parseInt(e.target.value))}
                      className="w-full"
                    />
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: Dashboard (8 cols) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="bg-blue-500/10 p-2 rounded-full mb-3">
                <ArrowUpRight className="text-blue-400" size={24}/>
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Total Ingresos Semestre</div>
              <div className="text-2xl font-bold text-blue-400">{formatCurrency(totalIncomeSem)}</div>
            </div>
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="bg-red-500/10 p-2 rounded-full mb-3">
                <ArrowDownRight className="text-red-400" size={24}/>
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Total Gastos Semestre</div>
              <div className="text-2xl font-bold text-red-400">{formatCurrency(totalOutSem)}</div>
            </div>
            <div className={`bg-slate-900/50 p-5 rounded-2xl border ${finalBal >= 0 ? 'border-success/30' : 'border-danger/30'} flex flex-col items-center justify-center text-center`}>
              <div className={`p-2 rounded-full mb-3 ${finalBal >= 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
                <Wallet className={finalBal >= 0 ? 'text-success' : 'text-danger'} size={24}/>
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Balance Neto Final</div>
              <div className={`text-2xl font-bold ${finalBal >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(finalBal)}</div>
            </div>
          </div>

          {/* Month Cards Grid */}
          <div className="space-y-4">
             <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="text-primary"/> Desglose Mensual del Semestre</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {months.map(m => (
                 <div key={m.m} className={`p-5 rounded-2xl border backdrop-blur-sm transition-all hover:border-primary/50 ${m.isVac ? 'bg-blue-950/20 border-blue-900/50' : 'bg-slate-900/50 border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${m.isVac ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {m.m}
                         </div>
                         <div>
                           <div className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Mes del Semestre</div>
                           <div className="text-sm font-bold flex items-center gap-1 uppercase tracking-widest">
                             {m.isVac ? <><Info size={12} className="text-blue-400"/> Vacaciones</> : 'Estudio'}
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Acumulado</div>
                          <div className={`text-lg font-black ${m.running >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(m.running)}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-widest border-b border-slate-800 pb-1">Ingresos</div>
                          {m.breakdown.incomes.map((inc, i) => (
                            <div key={i} className="flex justify-between text-xs py-0.5">
                               <span className="text-slate-400">{inc.label}</span>
                               <span className="text-blue-400 font-medium">+{formatCurrency(inc.value)}</span>
                            </div>
                          ))}
                       </div>
                       <div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-widest border-b border-slate-800 pb-1">Gastos</div>
                          {m.breakdown.expenses.map((exp, i) => (
                            <div key={i} className="flex justify-between text-xs py-0.5">
                               <span className="text-slate-400">{exp.label}</span>
                               <span className="text-red-400 font-medium">-{formatCurrency(exp.value)}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                       <div className="text-[10px] text-slate-500 uppercase font-bold">Cobertura de Gastos</div>
                       <div className="flex items-center gap-2 flex-1 max-w-[120px] ml-4">
                          <div className="h-1.5 bg-slate-800 rounded-full flex-1 overflow-hidden">
                             <div
                               className={`h-full ${m.coverage >= 100 ? 'bg-success' : m.coverage >= 50 ? 'bg-warning' : 'bg-danger'}`}
                               style={{width: `${Math.min(m.coverage, 100)}%`}}
                             ></div>
                          </div>
                          <span className={`text-[10px] font-bold ${m.coverage >= 100 ? 'text-success' : 'text-danger'}`}>
                            {Math.round(m.coverage)}%
                          </span>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Post-Graduation Section */}
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <GraduationCap size={120}/>
             </div>
             <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><TrendingUp className="text-primary"/> Proyección Etapa de Pago (Post-grado)</h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                   <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                      <span className="text-sm text-slate-400">Total Capital Financiado (70%)</span>
                      <span className="font-bold text-lg text-slate-200">{formatCurrency(totalD)}</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                      <span className="text-sm text-slate-400">Intereses Totales Causados</span>
                      <span className="font-bold text-lg text-red-400">{formatCurrency(interest)}</span>
                   </div>
                   <div className="flex justify-between items-end pt-2">
                      <span className="text-base font-bold text-slate-100 uppercase tracking-widest">Deuda Total Estimada</span>
                      <span className="text-2xl font-black text-red-500">{formatCurrency(totalOwed)}</span>
                   </div>

                   <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="bg-warning/20 p-2 rounded-lg text-warning">
                            <Calendar size={20}/>
                         </div>
                         <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Plazo de Pago</div>
                      </div>
                      <div className="text-right">
                         <div className="text-lg font-bold text-slate-200">{paymentMonths} meses</div>
                         <div className="text-[10px] text-slate-500 uppercase font-bold">3 años aproximadamente</div>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-slate-800/40 rounded-3xl border border-slate-700/50 text-center relative">
                   <div className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-4">Cuota Mensual Proyectada</div>
                   <div className="text-4xl font-black text-primary mb-1">{formatCurrency(monthlyQuota)}</div>
                   <div className="text-xs text-slate-500 mb-6 font-bold uppercase tracking-widest">durante {paymentMonths} meses / 3 años</div>

                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 px-1">
                         <span>Esfuerzo Salarial</span>
                         <span>{Math.round(pctSal)}%</span>
                      </div>
                      <div className="h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                         <div
                           className={`h-full rounded-full transition-all duration-1000 ${pctSal <= 15 ? 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]' : pctSal <= 25 ? 'bg-warning shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
                           style={{width: `${Math.min(pctSal, 100)}%`}}
                         ></div>
                      </div>
                   </div>

                   <div className="mt-8 p-4 rounded-2xl bg-slate-950/50 text-xs text-slate-400 leading-relaxed italic border border-slate-800">
                      {pctSal <= 15 ? (
                        <span className="flex items-center gap-2 justify-center text-success not-italic font-bold uppercase tracking-tighter">
                          <Info size={14}/> Cuota muy cómoda. Te sobran {formatCurrency(global_config.junior_salary - monthlyQuota)}/mes.
                        </span>
                      ) : pctSal <= 25 ? (
                        <span className="flex items-center gap-2 justify-center text-warning not-italic font-bold uppercase tracking-tighter">
                          <Info size={14}/> Manejable, pero planifica tus ahorros.
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 justify-center text-danger not-italic font-bold uppercase tracking-tighter">
                          <Info size={14}/> Cuota alta. Recomendamos buscar condonación.
                        </span>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* Glossary Section */}
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-widest"><Info className="text-primary"/> Glosario y Ayuda Teórica</h2>
             <div className="divide-y divide-slate-800">
               {GLOSARIO.map((item, idx) => (
                 <AccordionItem key={idx} title={item.title} content={item.content} />
               ))}
             </div>
          </div>

        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-slate-600 max-w-2xl mx-auto italic leading-relaxed uppercase tracking-widest">
          * Estimaciones basadas en salario mínimo proyectado 2026. Tasa efectiva anual del 14.56%. Los valores finales están sujetos a los desembolsos reales realizados por ICETEX y las condiciones vigentes del mercado financiero.
        </p>
      </div>
    </div>
  );
}
