import React, { useState, useMemo } from 'react';
import { FinanceTab, ThemeConfig } from '../types/calculator';
import { calculateCompoundInterest, calculateLoan, calculateTip } from '../utils/financialEngine';
import { DollarSign, Percent, Calendar, Users, Table, TrendingUp } from 'lucide-react';

interface FinancialCalculatorProps {
  theme: ThemeConfig;
}

export const FinancialCalculator: React.FC<FinancialCalculatorProps> = ({ theme }) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('loan');

  // Loan state
  const [principal, setPrincipal] = useState<number>(250000);
  const [loanRate, setLoanRate] = useState<number>(6.5);
  const [loanYears, setLoanYears] = useState<number>(30);
  const [extraPayment, setExtraPayment] = useState<number>(0);
  const [showAmortization, setShowAmortization] = useState(false);

  // Compound Interest state
  const [initialDeposit, setInitialDeposit] = useState<number>(10000);
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(500);
  const [compoundRate, setCompoundRate] = useState<number>(8.0);
  const [compoundYears, setCompoundYears] = useState<number>(20);
  const [showCompoundBreakdown, setShowCompoundBreakdown] = useState(false);

  // Tip Split state
  const [billAmount, setBillAmount] = useState<number>(85.0);
  const [tipPercent, setTipPercent] = useState<number>(18);
  const [numPeople, setNumPeople] = useState<number>(3);

  // Computations
  const loanResult = useMemo(() => {
    return calculateLoan(principal, loanRate, loanYears, extraPayment);
  }, [principal, loanRate, loanYears, extraPayment]);

  const compoundResult = useMemo(() => {
    return calculateCompoundInterest(initialDeposit, monthlyDeposit, compoundRate, compoundYears);
  }, [initialDeposit, monthlyDeposit, compoundRate, compoundYears]);

  const tipResult = useMemo(() => {
    return calculateTip(billAmount, tipPercent, numPeople);
  }, [billAmount, tipPercent, numPeople]);

  return (
    <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 rounded-2xl ${theme.cardClass}`}>
      {/* Sub-tab switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('loan')}
          className={`flex-1 py-2 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'loan'
              ? 'bg-cyan-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Loan / Mortgage
        </button>
        <button
          onClick={() => setActiveTab('compound')}
          className={`flex-1 py-2 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'compound'
              ? 'bg-cyan-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Compound Interest
        </button>
        <button
          onClick={() => setActiveTab('tip')}
          className={`flex-1 py-2 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'tip'
              ? 'bg-cyan-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tip & Bill Split
        </button>
      </div>

      {/* TAB 1: LOAN / MORTGAGE */}
      {activeTab === 'loan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Loan Principal ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Annual Interest Rate (%)
              </label>
              <div className="relative">
                <Percent className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  step="0.1"
                  value={loanRate}
                  onChange={(e) => setLoanRate(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Loan Term (Years)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  value={loanYears}
                  onChange={(e) => setLoanYears(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Extra Monthly Payment ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* KPI Output Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Monthly Payment
              </div>
              <div className="text-2xl font-mono font-bold text-cyan-300 mt-1 tabular-nums">
                ${loanResult.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {extraPayment > 0 && (
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  +${extraPayment} extra/mo
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Total Interest Paid
              </div>
              <div className="text-2xl font-mono font-bold text-slate-200 mt-1 tabular-nums">
                ${loanResult.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Total Amount Paid
              </div>
              <div className="text-2xl font-mono font-bold text-slate-200 mt-1 tabular-nums">
                ${loanResult.totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Toggle Amortization Schedule */}
          <div>
            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Table className="w-3.5 h-3.5" />
              <span>{showAmortization ? 'Hide Amortization Table' : 'View Amortization Schedule'}</span>
            </button>

            {showAmortization && (
              <div className="mt-3 overflow-x-auto max-h-60 border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Month</th>
                      <th className="p-2.5">Payment</th>
                      <th className="p-2.5">Principal</th>
                      <th className="p-2.5">Interest</th>
                      <th className="p-2.5">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-slate-300">
                    {loanResult.schedule.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-900/40">
                        <td className="p-2.5 text-slate-400">{row.month}</td>
                        <td className="p-2.5">${row.payment.toFixed(2)}</td>
                        <td className="p-2.5 text-emerald-400">${row.principal.toFixed(2)}</td>
                        <td className="p-2.5 text-rose-400">${row.interest.toFixed(2)}</td>
                        <td className="p-2.5 font-bold">${row.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPOUND INTEREST */}
      {activeTab === 'compound' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Initial Principal ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Monthly Contribution ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Estimated Annual Return (%)
              </label>
              <div className="relative">
                <TrendingUp className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  step="0.1"
                  value={compoundRate}
                  onChange={(e) => setCompoundRate(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Investment Horizon (Years)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  value={compoundYears}
                  onChange={(e) => setCompoundYears(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Compound Output Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Future Value
              </div>
              <div className="text-2xl font-mono font-bold text-cyan-300 mt-1 tabular-nums">
                ${compoundResult.futureValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Total Deposited
              </div>
              <div className="text-2xl font-mono font-bold text-slate-200 mt-1 tabular-nums">
                ${compoundResult.totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Total Interest Earned
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                +${compoundResult.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Yearly breakdown toggle */}
          <div>
            <button
              onClick={() => setShowCompoundBreakdown(!showCompoundBreakdown)}
              className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Table className="w-3.5 h-3.5" />
              <span>{showCompoundBreakdown ? 'Hide Yearly Breakdown' : 'View Yearly Accumulation'}</span>
            </button>

            {showCompoundBreakdown && (
              <div className="mt-3 overflow-x-auto max-h-60 border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Year</th>
                      <th className="p-2.5">Total Contributed</th>
                      <th className="p-2.5">Interest Earned</th>
                      <th className="p-2.5">End Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-slate-300">
                    {compoundResult.yearlyBreakdown.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-900/40">
                        <td className="p-2.5 text-slate-400">Year {row.year}</td>
                        <td className="p-2.5">${row.totalDeposited.toLocaleString()}</td>
                        <td className="p-2.5 text-emerald-400">+${row.interestEarned.toLocaleString()}</td>
                        <td className="p-2.5 font-bold">${row.endingBalance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TIP & BILL SPLITTER */}
      {activeTab === 'tip' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Bill Amount ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  value={billAmount}
                  onChange={(e) => setBillAmount(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Tip Percentage (%)
              </label>
              <div className="relative">
                <Percent className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  value={tipPercent}
                  onChange={(e) => setTipPercent(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Number of People
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  min="1"
                  value={numPeople}
                  onChange={(e) => setNumPeople(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Quick tip percentage buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-1">
              Quick:
            </span>
            {[10, 15, 18, 20, 25].map((pct) => (
              <button
                key={pct}
                onClick={() => setTipPercent(pct)}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                  tipPercent === pct
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Output Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Total Per Person
              </div>
              <div className="text-3xl font-mono font-bold text-cyan-300 mt-1 tabular-nums">
                ${tipResult.totalPerPerson.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                (Tip: ${tipResult.tipPerPerson.toFixed(2)} each)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Grand Total
                </div>
                <div className="text-2xl font-mono font-bold text-slate-200 mt-1 tabular-nums">
                  ${tipResult.totalWithTip.toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-emerald-400 font-mono mt-2">
                Total Tip Amount: ${tipResult.tipAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
