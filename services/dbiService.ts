
import { Issue, IssueCategory, InteractionLogEntry } from '../types';

export const VIOLATION_MAPPING: Record<IssueCategory, { code: string; title: string; description: string }> = {
    'Pest': {
        code: 'HC § 601',
        title: 'Maintenance of Property - Pest Infestation',
        description: 'Landlord must keep the premises free from pests, rodents, and vermin.'
    },
    'Elevator': {
        code: 'BC § 3001',
        title: 'Elevators and Conveying Systems',
        description: 'Elevators must be maintained in safe working order and inspected regularly.'
    },
    'Plumbing': {
        code: 'HC § 601',
        title: 'Maintenance of Property - Plumbing',
        description: 'Plumbing fixtures and piping must be maintained in good working condition and free from leaks.'
    },
    'Security': {
        code: 'HC § 1001',
        title: 'Security',
        description: 'Owner must provide and maintain operative locks and security measures as required by law.'
    },
    'Harassment': {
        code: 'Rent Ord § 37.10B',
        title: 'Tenant Harassment',
        description: 'Landlords are prohibited from engaging in bad faith conduct that interferes with a tenant\'s quiet enjoyment.'
    },
    'Electrical': {
        code: 'HC § 701',
        title: 'Electrical Requirements',
        description: 'All electrical equipment and wiring must be maintained in a safe condition.'
    },
    'Mold/Mildew': {
        code: 'HC § 601',
        title: 'Maintenance of Property - Mold/Mildew',
        description: 'Landlord must address moisture intrusion and maintain the property free of mold and mildew.'
    },
    'Medical Issue': {
        code: 'HC § 601',
        title: 'Maintenance of Property - Health Hazard',
        description: 'Conditions impacting health must be remediated immediately.'
    },
    'Other': {
        code: 'HC § 301',
        title: 'General Maintenance Requirements',
        description: 'Buildings must be maintained in a safe and sanitary condition.'
    }
};

export const dbiService = {
    mapIssueToViolation(categories: IssueCategory[]) {
        return categories.map(cat => VIOLATION_MAPPING[cat] || VIOLATION_MAPPING['Other']);
    },

    generateDBIPacket(issue: Issue, interactions: InteractionLogEntry[]) {
        const violations = this.mapIssueToViolation(issue.category);
        const interactionHistory = interactions
            .filter(log => log.relatedIssueId === issue.id)
            .sort((a, b) => new Date(a.expectedFollowUpDates).getTime() - new Date(b.expectedFollowUpDates).getTime()) // Fallback date field
            .map(log => `- ${new Date().toLocaleDateString()}: ${log.interactionType} with ${log.staffName}. Summary: ${log.summary}`)
            .join('\n');

        const packet = `
--- SF DBI COMPLAINT PACKET ---
DATE: ${new Date().toLocaleDateString()}
ISSUE ID: ${issue.id}

1. LOCATION OF VIOLATION:
[Tenant Unit/Address Placeholder] - Unit ${issue.tenantId || 'N/A'}

2. DESCRIPTION OF CONDITIONS:
${issue.description}

3. SF BUILDING/HOUSING CODE VIOLATIONS:
${violations.map(v => `${v.code} - ${v.title}: ${v.description}`).join('\n')}

4. RECORD OF NOTIFICATION (NEGLECT LOG):
Reported on: ${new Date(issue.dateStarted).toLocaleDateString()}
Status: ${issue.status}
Days Unresolved: ${issue.daysSinceReported}

Interaction History:
${interactionHistory || 'No interactions logged by management since report.'}

5. TENANT STATEMENT:
I am filing this complaint because management has failed to address these habitability issues despite multiple notifications. The delay of ${issue.daysSinceReported} days has caused significant distress and potential health hazards.

--- END OF PACKET ---
    `.trim();

        return packet;
    }
};
