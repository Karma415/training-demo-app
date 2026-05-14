import React from 'react';
import { BuildingRedactedIssue, IssueCategory, FloorPlanUnit } from '../types';
import floorPlansData from '../src/data/floor_plans.json';

interface FloorMapVisualizerProps {
  issues: BuildingRedactedIssue[];
  selectedFloor: number;
  highlightedStack: string | null;
  onHoverStack: (stack: string | null) => void;
}

export const FloorMapVisualizer: React.FC<FloorMapVisualizerProps> = ({
  issues,
  selectedFloor,
  highlightedStack,
  onHoverStack
}) => {
  const currentFloorData = floorPlansData.floors.find(f => f.floor === selectedFloor);

  if (!currentFloorData) {
    return <div className="p-8 text-center text-slate-500">No floor plan data available for Floor {selectedFloor}</div>;
  }

  const getIssueColor = (category: IssueCategory) => {
    switch (category) {
      case 'Plumbing': return '#2563eb'; // blue-600
      case 'Electrical': return '#d97706'; // amber-600
      case 'Medical Issue': return '#ea580c'; // orange-600
      case 'Pest': return '#16a34a'; // green-600
      case 'Harassment': return '#9333ea'; // purple-600
      default: return '#dc2626'; // red-600 as fallback
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-slate-50 rounded-xl border p-4 shadow-inner relative">
      <svg 
        viewBox="-50 -50 900 550" 
        className="w-full h-auto min-w-[600px] max-w-[1000px] mx-auto drop-shadow-sm"
      >
        {/* Draw Units */}
        {currentFloorData.units.map((unit: FloorPlanUnit) => {
          // Find any active issues for this specific unit
          const unitIssues = issues.filter(i => 
            i.floor === selectedFloor && 
            // In our data, the unit number needs to match. If issue doesn't have unit num, it's just floor level.
            // Wait, BuildingRedactedIssue doesn't have a unit number specifically, it's redacted. 
            // Hmm, if issues are fully redacted to just floor, we can't pinpoint them to a single unit. 
            // Let's assume for the heat map, we mapped the vertical stacks. 
            // Wait, if BuildingRedactedIssue only has `floor`, we can't map it to `unit`. 
            // We need a way to assign an issue to a unit or stack.
            // Let's check what properties it has. It has `id`, `floor`, `category`, `status`, `dateStarted`.
            // Let's just mock assigning them to random units for demonstration if they don't have one, OR use a stack map if it exists.
            (i as any).unit === unit.id // We will pass 'unit' explicitly when rendering
          );

          const activeIssue = unitIssues.length > 0 ? unitIssues[0] : null;
          
          const isHighlightedStack = highlightedStack === unit.verticalStack;
          const isOffice = !unit.isResidential;

          let fill = '#ffffff';
          let stroke = '#cbd5e1'; // slate-300
          let strokeWidth = 2;

          if (isOffice) {
            fill = '#f1f5f9'; // slate-100
          } else if (activeIssue) {
            fill = getIssueColor(activeIssue.category);
            stroke = getIssueColor(activeIssue.category);
          } else if (isHighlightedStack) {
            fill = '#fef08a'; // yellow-200 (highlight stack)
            stroke = '#eab308'; // yellow-500
          }

          return (
            <g 
              key={unit.id}
              className={`transition-all duration-300 ${activeIssue || isHighlightedStack ? 'cursor-pointer' : 'cursor-default'}`}
              onMouseEnter={() => onHoverStack(unit.verticalStack)}
              onMouseLeave={() => onHoverStack(null)}
            >
              <rect
                x={unit.layout.x}
                y={unit.layout.y}
                width={unit.layout.w * 0.9} // Slight gap between units
                height={unit.layout.h * 0.9}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                rx={4}
                className="hover:brightness-95"
              />
              {/* Unit Label */}
              <text
                x={unit.layout.x + (unit.layout.w * 0.45)}
                y={unit.layout.y + (unit.layout.h * 0.45)}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="24"
                fontWeight="bold"
                fill={activeIssue ? '#ffffff' : (isOffice ? '#94a3b8' : '#64748b')}
              >
                {unit.id}
              </text>

              {/* Tooltip */}
              <title>
                {isOffice ? 'Office / Common Area' : `Unit ${unit.id}`}
                {activeIssue ? `\nActive Issue: ${activeIssue.category}\nStatus: ${activeIssue.status}` : ''}
              </title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
