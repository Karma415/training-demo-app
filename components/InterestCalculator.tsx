
import React, { useState } from 'react';
import { calculateRentInterest } from '../services/legalEngine';

interface InterestCalculatorProps {
  moveInDate?: string;
}

const InterestCalculator: React.FC<InterestCalculatorProps> = ({ moveInDate }) => {
  const [customDeposit, setCustomDeposit] = useState(0);
  const [customDate, setCustomDate] = useState(moveInDate || new Date().toISOString());

  const { total, breakdown } = calculateRentInterest(customDeposit, customDate);

  return (
    <div className="max-w-4xl animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Rent Board Interest Calculator</h1>
        <p className="text-slate-500 mt-1">In San Francisco, landlords must pay annual interest on security deposits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-8">
            <h3 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Calculator Inputs</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Security Deposit Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">$</span>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                    value={customDeposit}
                    onChange={(e) => setCustomDeposit(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Move-In Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-blue-500"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-800 leading-relaxed">
                <i className="fa-solid fa-circle-info mr-1"></i>
                Interest is due by March 1st of each year. The rate is set annually by the SF Rent Board based on market yields.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1e3a8a] text-white rounded-xl shadow-xl p-8 text-center">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">Total Interest Owed</p>
            <h2 className="text-5xl font-bold mb-4">${total.toFixed(2)}</h2>
            <p className="text-sm text-blue-200">Accumulated since {new Date(customDate).getFullYear()}</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6 overflow-hidden">
            <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Period Breakdown</h3>
            <div className="space-y-3">
              {breakdown.length > 0 ? breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-bold text-slate-700">{item.period}</p>
                    <p className="text-[10px] text-slate-400">Rate: {item.rate}</p>
                  </div>
                  <p className="font-bold text-emerald-600">+${item.amount.toFixed(2)}</p>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic text-center py-4">No interest periods found for these dates.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestCalculator;
