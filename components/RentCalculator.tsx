import React from 'react';
import { Issue, Tenant } from '../types';

import rentFactors from '../src/data/rent_relief_factors.json';

interface RentCalculatorProps {
  issue: Issue;
  tenant: Tenant | null;
  interactions?: any[]; // Accept interactions from parent
}

// Helper to extract median percentage from strings like "Estimated 15%–25%"
const parsePercentage = (notes?: string): number => {
  if (!notes) return 0.10; // Default 10%
  const matches = notes.match(/(\d+)%/g);
  if (matches && matches.length >= 2) {
    const min = parseInt(matches[0]);
    const max = parseInt(matches[1]);
    return ((min + max) / 2) / 100;
  } else if (matches && matches.length === 1) {
    return parseInt(matches[0]) / 100;
  }
  return 0.10; // Fallback
};

const RentCalculator: React.FC<RentCalculatorProps> = ({ issue, tenant, interactions = [] }) => {
  if (!tenant || !tenant.monthlyRent) {
    return (
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm my-4">
        <p className="text-slate-600 text-sm font-medium">
          <i className="fa-solid fa-circle-info mr-2"></i>
          Add your monthly rent in your profile to see potential accrued rent credits for overdue repairs.
        </p>
      </div>
    );
  }

  // Make sure we have a valid start date
  if (!issue.dateStarted) return null;

  const today = new Date();
  const reportedDate = new Date(issue.dateStarted);
  
  // The backend might return repair_clock_hours inside the issue object. 
  // If not found, default to 336 hours (14 days).
  const repairClockHours = (issue as any).repairClockHours || (issue as any).repair_clock_hours || 336; 
  const repairDeadline = new Date(reportedDate.getTime() + repairClockHours * 60 * 60 * 1000);
  
  if (today <= repairDeadline) {
    return null; // Not overdue yet
  }

  const daysOverdue = Math.floor((today.getTime() - repairDeadline.getTime()) / (1000 * 3600 * 24));
  
  if (daysOverdue <= 0) return null;

  // Determine percentage and reasoning based on rent_relief_factors.json
  const issueCategoryString = Array.isArray(issue.category) ? issue.category[0] : (issue.category as any);
  if (!issueCategoryString) return null;

  const categoryLower = issueCategoryString.toLowerCase();
  
  // Find matching factor
  let matchedFactor = null;
  for (const factor of rentFactors) {
    const keywords = factor.keywords || [];
    const tags = factor.scenario_tags || [];
    if (
      keywords.some((k: string) => categoryLower.includes(k.toLowerCase())) ||
      tags.some((t: string) => categoryLower.includes(t.toLowerCase().replace('_', ' ')))
    ) {
      matchedFactor = factor;
      break;
    }
  }

  // If no exact match from JSON, check fallback heuristics, otherwise default 10%
  let percentage = 0.10;
  let calculationBasisText = "Standard 10% reduction for diminished housing services";
  
  if (matchedFactor) {
    percentage = parsePercentage(matchedFactor.rent_reduction_notes);
    calculationBasisText = `Based on SF Rent Board precedent for ${matchedFactor.title} (${matchedFactor.rent_reduction_notes})`;
  } else {
    // Fallback estimations if keywords didn't exactly align
    if (categoryLower.includes('heat')) { percentage = 0.20; calculationBasisText = "Estimated 20% for loss of heat"; }
    else if (categoryLower.includes('water') && categoryLower.includes('shutoff')) { percentage = 0.75; calculationBasisText = "Estimated 75% for total water shutoff"; }
    else if (categoryLower.includes('water') || categoryLower.includes('plumbing')) { percentage = 0.40; calculationBasisText = "Estimated 40% for severe plumbing issues"; }
    else if (categoryLower.includes('pest') || categoryLower.includes('roach')) { percentage = 0.15; calculationBasisText = "Estimated 15% for pest infestation"; }
    else if (categoryLower.includes('elevator')) { percentage = 0.10; calculationBasisText = "Estimated 10% for broken elevator"; }
    else if (categoryLower.includes('mold') || categoryLower.includes('dampness')) { percentage = 0.15; calculationBasisText = "Estimated 15% for mold exposure"; }
    else if (categoryLower.includes('toilet')) { percentage = 0.30; calculationBasisText = "Estimated 30% for lack of sanitation"; }
  }

  const dailyRent = tenant.monthlyRent / 30;
  
  // Calculate harassment multiplier
  const harassmentTags = ['Aggressive/Hostile', 'Illegal Entry/Visitor Denied', 'aggressive', 'illegal entry'];
  const harassmentCount = interactions.filter(interaction => {
    // Check if the vibe or interactionCategory matches harassment tags
    const vibe = interaction.vibe?.toLowerCase() || '';
    const topics = Array.isArray(interaction.topic) ? interaction.topic : (interaction.interactionCategory || []);
    const hasHarassingTopic = topics.some((t: string) => harassmentTags.some(tag => t.toLowerCase().includes(tag)));
    
    return vibe === 'hostile' || vibe === 'illegal_entry' || hasHarassingTopic;
  }).length;
  
  const isTrebleDamages = harassmentCount > 0;
  const multiplier = isTrebleDamages ? 3 : 1;
  const accruedCredit = dailyRent * percentage * daysOverdue * multiplier;

  return (
    <div className={`p-6 rounded-2xl shadow-sm my-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 border ${isTrebleDamages ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
      <h3 className={`text-lg font-black mb-2 flex items-center tracking-tight ${isTrebleDamages ? 'text-rose-900' : 'text-emerald-900'}`}>
        <i className={`fa-solid ${isTrebleDamages ? 'fa-scale-unbalanced text-rose-600' : 'fa-money-bill-wave text-emerald-600'} mr-3`}></i>
        {isTrebleDamages ? 'Treble Damages Claim' : 'Accrued Rent Credit'}
      </h3>
      <div className="flex items-end space-x-2">
        <span className={`text-4xl font-black tracking-tighter ${isTrebleDamages ? 'text-rose-700' : 'text-emerald-700'}`}>${accruedCredit.toFixed(2)}</span>
        <span className={`text-sm font-bold mb-1 uppercase tracking-widest ${isTrebleDamages ? 'text-rose-600/80' : 'text-emerald-600/80'}`}>Potential Claim</span>
      </div>
      
      {isTrebleDamages && (
        <div className="mt-4 bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-widest py-2 px-3 rounded-xl inline-flex items-center">
            <i className="fa-solid fa-triangle-exclamation mr-2"></i> Targeted Harassment Detected (x3 Multiplier)
        </div>
      )}

      <p className={`text-sm mt-4 font-medium leading-relaxed ${isTrebleDamages ? 'text-rose-800' : 'text-emerald-800'}`}>
        This issue is <strong className={`font-black px-1 rounded ${isTrebleDamages ? 'bg-rose-200' : 'bg-emerald-100'}`}>{daysOverdue} days overdue</strong> past the legal repair clock. 
        <br/><br/>
        <strong>Calculation Basis:</strong> {calculationBasisText}.
        {isTrebleDamages ? <><br/><br/><i>Multiplied by 3 under SF Admin Code 37.10B for targeted harassment.</i> You may be owed this amount in rent overpayments if filed via Form 516A.</> : ' You may be owed this amount in rent overpayments if filed via Form 516A.'}
      </p>
    </div>
  );
}

export default RentCalculator;
