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
  Briefcase
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

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;

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

    months.push({ m, isVac, totalIn, totalOut, running, coverage: (totalIn / (totalOut || 1)) * 100 });
  }

  const finalBal = months[5].running;
  const totalIncomeSem = months.reduce((s, x) => s + x.totalIn, 0);
  const totalOutSem = months.reduce((s, x) => s + x.totalOut, 0);

  // Post-grad
  const totalF = global_config.icetex_credit * FIN_SEMS;
  const totalD = totalF * 0.7;
  const interest = totalF * RATE * (FIN_SEMS * 0.5);
  const totalOwed = totalD + interest;
  const monthlyQuota = totalOwed / (POST_SEMS * 6);
  const pctSal = (monthlyQuota / global_config.junior_salary) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Configuration */}
        <div className="lg:col-span-1 space-y-6">
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
                <div className="text-right text-sm font-medium mt-1">{formatCurrency(global_config.vacation_income)}</div>
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
                <div className="text-right text-sm font-medium mt-1">{formatCurrency(global_config.junior_salary)}</div>
              </div>
            </div>

            <hr className="my-6 border-slate-800" />

            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <div className="text-sm font-medium">📄 Crédito ICETEX 30%</div>
                    <div className="text-[10px] text-slate-500">Pagas el 30% en vacaciones</div>
                  </div>
                  <input
                    type="checkbox" checked={global_config.icetex_active}
                    onChange={(e) => handleGlobalChange('icetex_active', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900"
                  />
               </div>

               {global_config.icetex_active && (
                 <div className="pl-2 border-l-2 border-primary/30">
                    <label className="text-xs text-slate-400 block mb-1">Monto por semestre</label>
                    <input
                      type="range" min="300000" max="3000000" step="50000"
                      value={global_config.icetex_credit}
                      onChange={(e) => handleGlobalChange('icetex_credit', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-right text-sm font-medium mt-1">{formatCurrency(global_config.icetex_credit)}</div>
                 </div>
               )}

               <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <div className="text-sm font-medium">🏛 Subsidio Sostenimiento</div>
                    <div className="text-[10px] text-slate-500">Solo Sisbén A, B, C1–C7</div>
                  </div>
                  <input
                    type="checkbox" checked={global_config.subsidy_active}
                    onChange={(e) => handleGlobalChange('subsidy_active', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900"
                  />
               </div>

               <div>
                 <label className="text-xs text-slate-400 block mb-1">📅 Trabajo fines de semana</label>
                 <select
                   value={global_config.fds_option}
                   onChange={(e) => handleGlobalChange('fds_option', parseInt(e.target.value))}
                   className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm"
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
              className="w-full mt-8 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              <Save size={18} /> {saving ? 'Guardando...' : 'Guardar por Defecto'}
            </button>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
             <h2 className="text-lg font-semibold mb-4">📋 Gastos Mensuales</h2>
             <div className="space-y-4">
               {gastos.map(g => (
                 <div key={g.id}>
                    <label className="text-xs text-slate-400 block mb-1">{g.label}</label>
                    <input
                      type="range" min={g.min_val} max={g.max_val} step={g.step}
                      value={g.current_value}
                      onChange={(e) => handleGastoChange(g.id, parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-right text-sm font-medium">{formatCurrency(g.current_value)}</div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: Dashboard */}
        <div className="lg:col-span-2 space-y-8">

          {/* Header Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Ingresos Sem." value={formatCurrency(totalIncomeSem)} icon={<TrendingUp size={16}/>} color="text-blue-400" />
            <StatCard label="Gastos Sem." value={formatCurrency(totalOutSem)} icon={<DollarSign size={16}/>} color="text-red-400" />
            <StatCard label="Balance Final" value={formatCurrency(finalBal)} icon={<Wallet size={16}/>} color={finalBal >= 0 ? "text-success" : "text-danger"} />
            <StatCard label="Cuota Post" value={formatCurrency(monthlyQuota)} icon={<GraduationCap size={16}/>} color="text-warning" />
          </div>

          {/* Month Grid */}
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar className="text-primary"/> Ciclo Semestral</h2>
             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
               {months.map(m => (
                 <div key={m.m} className={`p-3 rounded-xl border ${m.isVac ? 'bg-blue-900/20 border-blue-800/50' : 'bg-slate-800/30 border-slate-700/50'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-bold opacity-60">MES {m.m}</span>
                       <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${m.isVac ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                         {m.isVac ? 'Vacac.' : 'Estudio'}
                       </span>
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden my-2">
                       <div className={`h-full ${m.coverage >= 100 ? 'bg-success' : 'bg-danger'}`} style={{width: `${Math.min(m.coverage, 100)}%`}}></div>
                    </div>
                    <div className={`text-sm font-bold mt-3 ${m.running >= 0 ? 'text-success' : 'text-danger'}`}>
                       {formatCurrency(m.running)}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase">Acumulado</div>
                 </div>
               ))}
             </div>
          </div>

          {/* Post-Graduation Section */}
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
             <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><TrendingUp className="text-primary"/> Proyección Post-grado</h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Deuda al graduarte</span>
                      <span className="font-semibold text-danger">{formatCurrency(totalD)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Intereses acumulados</span>
                      <span className="font-semibold text-danger">{formatCurrency(interest)}</span>
                   </div>
                   <div className="flex justify-between text-sm border-t border-slate-800 pt-2">
                      <span className="text-slate-400 font-bold">Total a pagar</span>
                      <span className="font-bold text-red-500">{formatCurrency(totalOwed)}</span>
                   </div>
                </div>

                <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 text-center">
                   <div className="text-xs text-slate-400 uppercase mb-2">% del Salario Junior</div>
                   <div className="text-4xl font-bold text-primary mb-2">{Math.round(pctSal)}%</div>
                   <div className="h-2 bg-slate-700 rounded-full overflow-hidden max-w-[200px] mx-auto">
                      <div
                        className={`h-full ${pctSal <= 15 ? 'bg-success' : pctSal <= 25 ? 'bg-warning' : 'bg-danger'}`}
                        style={{width: `${Math.min(pctSal, 100)}%`}}
                      ></div>
                   </div>
                   <div className="mt-4 text-xs text-slate-400 leading-relaxed italic">
                      {pctSal <= 15 ? "✅ Cuota cómoda. Te sobran "+formatCurrency(global_config.junior_salary - monthlyQuota)+"/mes." :
                       pctSal <= 25 ? "⚠️ Manejable, pero ajustado." :
                       "🔴 Cuota alta. Considera el Fondo Transformando Vidas."}
                   </div>
                </div>
             </div>
          </div>

          {/* Glossary Section */}
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Info className="text-primary"/> Glosario del Estudiante</h2>
             <div className="divide-y divide-slate-800">
               {GLOSARIO.map((item, idx) => (
                 <AccordionItem key={idx} title={item.title} content={item.content} />
               ))}
             </div>
          </div>

        </div>
      </div>

      <p className="text-center text-[10px] text-slate-600 mt-8 max-w-2xl mx-auto italic">
        * Estimaciones basadas en salario mínimo 2026. Tasa 14.56% EA. Los valores pueden variar según desembolsos reales y políticas del ICETEX.
      </p>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-tighter mb-1">
        {icon} {label}
      </div>
      <div className={`text-base font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
}
