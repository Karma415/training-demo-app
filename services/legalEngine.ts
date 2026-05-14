import { Issue, LegalRecommendation } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VIOLATION_MAPPING } from './dbiService';

/**
 * Calculates differences in days between two ISO dates
 */
const getDaysDiff = (startDate: string) => {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * AI-powered legal simplification with accessibility focus
 */
export const simplifyLegalCode = async (codeSnippet: string) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing Gemini API Key');
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `Act as a San Francisco Tenant Rights advocate. Simplify this SF Housing Code or legal notice.
    
    CRITICAL INSTRUCTIONS:
    1. READING LEVEL: Use a 6th-8th grade reading level. Use short sentences and simple words.
    2. VISUAL AIDS: Use emojis to represent concepts (e.g., ⏳ for time, 📄 for papers, 💰 for money, ⚖️ for laws).
    
    Snippet: "${codeSnippet}"
    
    Return a JSON object with these exact keys:
    {
      "plainEnglish": "A very simple explanation with an emoji prefix",
      "tenantRight": "The one main right this gives you (use ⚖️)",
      "actionableForm": "The name of the form or letter you need (use 📄)",
      "checklist": ["⏳ Step 1...", "📄 Step 2...", "✅ Step 3..."]
    }`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text() || '{}');
  } catch (error) {
    console.error("Legal Engine Error:", error);
    return null;
  }
};

/**
 * SF Tenant Rights Engine Logic
 */
export const getLegalAdviceForIssue = (issue: Issue): LegalRecommendation[] => {
  const advices: LegalRecommendation[] = [];
  const daysPassed = getDaysDiff(issue.dateStarted);
  const categories = Array.isArray(issue.category) ? issue.category : [issue.category as any];

  // Add SF Building Code violations based on categories
  categories.forEach(cat => {
    const mapping = (VIOLATION_MAPPING as any)[cat];
    if (mapping) {
      advices.push({
        title: `⚖️ ${mapping.code} Violation`,
        description: mapping.description,
        type: cat === 'Harassment' ? 'harassment' : 'dbi'
      });
    }
  });

  if (categories.includes('Other') || categories.includes('Plumbing') || categories.includes('Electrical')) {
    advices.push({
      title: "🚨 Emergency Rules",
      description: "SF Law says your landlord must respond to emergencies (no water/heat) in 24 to 72 hours.",
      isAlert: issue.daysSinceReported > 3,
      type: 'emergency'
    });

    if (daysPassed >= 3 && issue.status !== 'Resolved') {
      advices.push({
        title: "📄 Report to the City",
        description: `It has been ${daysPassed} days. You should file a 'Notice of Violation' with the SF Building Department.`,
        link: { text: "Generated DBI Packet Ready", url: "#" },
        type: 'dbi'
      });
    }
  }

  if (issue.status === 'Stalled' || daysPassed > 14) {
    advices.push({
      title: "⚠️ Neglect Alert",
      description: "This issue hasn't been addressed for over 2 weeks. This is strong evidence of negligence for a Rent Board petition.",
      isAlert: true,
      type: 'rentboard'
    });
  }

  if (categories.includes('Harassment')) {
    advices.push({
      title: "⚖️ Protection from Harassment",
      description: "SF Code § 37.10B says your landlord cannot bother you or enter without notice. Document every time they do this.",
      isAlert: true,
      type: 'harassment'
    });
  }

  if (!issue.category.includes('Harassment') && daysPassed >= 30 && issue.status !== 'Resolved') {
    advices.push({
      title: "💰 Repair & Deduct",
      description: "If fixed aren't made in 30 days, you might be able to pay for the fix yourself and take it out of your rent. ⚠️ TALK TO A LAWYER FIRST!",
      link: { text: "See Repair Rules", url: "https://sftenantsunion.org/repairs/" },
      type: 'repairdeduct'
    });
  }

  if (issue.status !== 'Resolved' && daysPassed > 1) {
    advices.push({
      title: "📉 Rent Reduction Petition",
      description: "You may be owed money back for living with these bad conditions. Use Form 516A to ask for a rent decrease.",
      link: { text: "Get Form 516A", url: "https://sfrb.org/sites/default/files/516A%20Tenant%20Petition%20for%20Decrease%20in%20Services.pdf" },
      type: 'rentboard'
    });
  }

  return advices;
};

export const INTEREST_RATES = [
  { start: '2024-03-01', end: '2025-02-28', rate: 0.052 },
  { start: '2023-03-01', end: '2024-02-29', rate: 0.023 },
  { start: '2022-03-01', end: '2023-02-28', rate: 0.001 },
  { start: '2021-03-01', end: '2022-02-28', rate: 0.006 },
];

export const calculateRentInterest = (deposit: number, moveInDate: string): { total: number; breakdown: any[] } => {
  const moveIn = new Date(moveInDate);
  const now = new Date();
  let total = 0;
  const breakdown: {
    period: string;
    rate: string;
    amount: number;
  }[] = [];

  INTEREST_RATES.forEach(period => {
    const pStart = new Date(period.start);
    const pEnd = new Date(period.end);
    if (moveIn < pEnd && now > pStart) {
      const yearInterest = deposit * period.rate;
      total += yearInterest;
      breakdown.push({
        period: `${period.start} to ${period.end}`,
        rate: (period.rate * 100).toFixed(1) + '%',
        amount: yearInterest
      });
    }
  });
  return { total, breakdown };
};
