
import React, { useState } from 'react';
import { BuildingRedactedIssue } from '../types';
import { FloorMapVisualizer } from './FloorMapVisualizer';
import floorPlansData from '../src/data/floor_plans.json';

interface IssueHeatMapProps {
  issues: BuildingRedactedIssue[];
}

const IssueHeatMap: React.FC<IssueHeatMapProps> = ({ issues }) => {
  const [highlightedStack, setHighlightedStack] = useState<string | null>(null);

  // We want to render the building from top to bottom (Floor 7 down to Floor 2)
  const sortedFloors = [...floorPlansData.floors].sort((a, b) => b.floor - a.floor);

  return (
    <div className="max-w-6xl animate-in fade-in slide-in-from-left duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Spatial Building Heat Map</h1>
        <p className="text-slate-500 mt-1 italic">Identify systematic failures and vertical spread through the master floor plan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-3 space-y-6 bg-slate-900 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2 px-2 border-b border-slate-700 pb-2">
            <span className="font-semibold text-sm tracking-widest uppercase">Building Cross-Section</span>
            <span className="text-xs">Hover over any unit to highlight vertical spread</span>
          </div>

          <div className="space-y-4">
            {sortedFloors.map(floorData => (
              <div key={floorData.floor} className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="w-full md:w-24 shrink-0 text-center md:text-left">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Floor</span>
                  <p className="text-3xl font-black text-blue-400">{floorData.floor}</p>
                </div>
                <div className="flex-1 w-full max-w-full overflow-hidden">
                  <FloorMapVisualizer 
                    issues={issues} 
                    selectedFloor={floorData.floor} 
                    highlightedStack={highlightedStack}
                    onHoverStack={setHighlightedStack}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sticky top-6">
            <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest border-b pb-2">Legend</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-sm bg-[#ffffff] border-2 border-slate-300"></span> <span className="text-slate-600">No Issues</span></div>
              <div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-sm border-2 border-[#16a34a] bg-[#16a34a]"></span> <span className="font-medium text-slate-700">Pests</span></div>
              <div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-sm border-2 border-[#2563eb] bg-[#2563eb]"></span> <span className="font-medium text-slate-700">Plumbing (Water)</span></div>
              <div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-sm border-2 border-[#ea580c] bg-[#ea580c]"></span> <span className="font-medium text-slate-700">Medical / Mold</span></div>
              <div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-sm border-2 border-[#d97706] bg-[#d97706]"></span> <span className="font-medium text-slate-700">Electrical</span></div>
              <div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-sm border-2 border-[#9333ea] bg-[#9333ea]"></span> <span className="font-medium text-slate-700">Harassment</span></div>
              <div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-sm bg-[#f1f5f9] border-2 border-slate-300"></span> <span className="text-slate-500 italic">Common / Office</span></div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
               <h3 className="font-bold text-slate-800 mb-2 text-sm flex items-center">
                 <i className="fa-solid fa-layer-group text-blue-500 mr-2"></i> Vertical Stacks
               </h3>
               <p className="text-xs text-slate-500 leading-relaxed mb-4">
                 Water leaks and pests often travel straight down sharing the same vertical support walls (called stacks). Hovering highlights other units in the direct danger path.
               </p>
            </div>
            
            <div className="mt-4 pt-6 flex items-start space-x-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <i className="fa-solid fa-circle-info text-emerald-600 mt-1"></i>
              <p className="text-xs text-emerald-800 leading-relaxed">
                <strong>Organizing Strength:</strong> Notice multiple colored units in a line? Form a Tenants Association. Legal petitions citing "systemic failure" yield higher results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueHeatMap;
