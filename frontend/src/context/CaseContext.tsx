import React, { createContext, useContext, useState, useEffect } from 'react';
import { Case, ThreatNetwork, VehicleRecord, Statement } from '../types';

interface CaseContextType {
  cases: Case[];
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  threatNetworks: ThreatNetwork[];
  showHotspots: boolean;
  setShowHotspots: (show: boolean) => void;
  vehicles: VehicleRecord[];
  activeCase: Case | null;
  onAddStatement: (caseId: string, statement: Statement) => void;
  onAddCase: (newCase: Case) => void;
  onToggleCaseStatus: (caseId: string) => void;
  onDismantleNetwork: (networkId: string) => void;
  onDeleteCase: (caseId: string) => void;
  onUpdateCase: (caseId: string, updates: Partial<Case>) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

// Seed initial mock threat networks
const initialThreatNetworks: ThreatNetwork[] = [
  {
    id: 'net_syndicate',
    name: 'The Syndicate Ring',
    status: 'active',
    cases: ['case_1', 'case_2'],
    suspects: ['Marcus Vance', 'Leon Croft'],
    vehicles: ['KA-01-A-1234', 'KA-03-B-5678']
  }
];

// Seed initial statements for Case 1 (Syndicate Robbery)
const case1Statements: Statement[] = [
  {
    id: 'stmt_1',
    speaker_name: 'Marcus Vance',
    speaker_role: 'witness',
    media_type: 'video',
    transcript: 'I was standing near Koramangala 80 Feet Rd around 10:45 PM. Suddenly, I heard a smash. I saw a tall man wearing a black leather jacket running out of the jewelry store. He got into a black SUV and fled. The license plate was KA-01-A-1234.',
    behavioral_risk: {
      stress_score: 15,
      indicators: ['Normal baseline speech pattern', 'Clear structural timeline'],
      risk_level: 'low'
    },
    extracted_entities: {
      locations: ['Koramangala 80 Feet Rd'],
      vehicles: ['Black SUV KA-01-A-1234'],
      suspects: ['tall man']
    },
    timestamp: '2026-06-16 11:00 PM'
  },
  {
    id: 'stmt_2',
    speaker_name: 'Leon Croft',
    speaker_role: 'suspect',
    media_type: 'audio',
    transcript: 'Honestly, I don\'t remember where I was at 10:45 PM. Uh, maybe I was driving my blue sedan or something, I guess. I swear to god, I don\'t own a black SUV and I have never been to Koramangala in my life. You have the wrong person.',
    behavioral_risk: {
      stress_score: 75,
      indicators: [
        'Memory evasion marker: \'don\'t remember\'',
        'Hesitation fillers detected (uh, maybe, i guess)',
        'Defensive assertion: \'swear to god\'',
        'TIMELINE DISCREPANCY: Contradicts eyewitness vehicle description'
      ],
      risk_level: 'high'
    },
    extracted_entities: {
      locations: ['Koramangala'],
      vehicles: ['blue sedan'],
      suspects: []
    },
    timestamp: '2026-06-17 09:30 AM'
  }
];

// Seed initial statements for Case 2 (Syndicate Assault)
const case2Statements: Statement[] = [
  {
    id: 'stmt_3',
    speaker_name: 'Inspector Gowda',
    speaker_role: 'witness',
    media_type: 'text',
    transcript: 'We responded to an assault call on Indiranagar 100 Feet Rd. A blue sedan plate KA-03-B-5678 was spotted leaving the alley. The suspect had a stocky build and a tattoo on his left arm.',
    behavioral_risk: {
      stress_score: 10,
      indicators: ['Clear police report baseline'],
      risk_level: 'low'
    },
    extracted_entities: {
      locations: ['Indiranagar 100 Feet Rd'],
      vehicles: ['blue sedan KA-03-B-5678'],
      suspects: ['stocky male']
    },
    timestamp: '2026-06-15 09:30 PM'
  }
];

// Seed initial cases
const initialCases: Case[] = [
  {
    id: 'case_1',
    crime_type: 'Robbery',
    location: 'Koramangala 80 Feet Rd',
    coordinates: [12.9352, 77.6244],
    timestamp: '2026-06-16 10:45 PM',
    suspect_description: 'Tall athletic male, wearing a black leather jacket, dark jeans, and a baseball cap.',
    vehicle_details: 'Black SUV with plate KA-01-A-1234',
    is_organized_crime: true,
    status: 'active',
    threat_network_id: 'net_syndicate',
    narrative: 'At 10:45 PM on Koramangala 80 Feet Rd, a jewelry store robbery was executed. The suspect, described as a tall male in a black leather jacket, brandished a weapon and took high-value gems. He fled in a black SUV with plate KA-01-A-1234. Witness heard him mention the Syndicate gang.',
    statements: case1Statements
  },
  {
    id: 'case_2',
    crime_type: 'Assault',
    location: 'Indiranagar 100 Feet Rd',
    coordinates: [12.9719, 77.6412],
    timestamp: '2026-06-15 09:15 PM',
    suspect_description: 'Stocky build, short buzz cut hair, wearing a grey hoodie and running shoes. Notable tattoo on left arm.',
    vehicle_details: 'Blue Sedan with plate KA-03-B-5678',
    is_organized_crime: true,
    status: 'resolved',
    threat_network_id: 'net_syndicate',
    narrative: 'Indiranagar 100 Feet Rd: Coordinated assault outside a local establishment. The attacker, a stocky male with a buzz cut wearing a grey hoodie, assaulted a witness who was tracking syndicate movements. He escaped in a blue Sedan, plate KA-03-B-5678.',
    statements: case2Statements
  },
  {
    id: 'case_3',
    crime_type: 'Burglary',
    location: 'MG Road Metro Station',
    coordinates: [12.9754, 77.6068],
    timestamp: '2026-06-16 02:30 AM',
    suspect_description: 'Average height, wearing a dark green windbreaker and medical mask.',
    vehicle_details: 'None',
    is_organized_crime: false,
    status: 'active',
    narrative: 'MG Road Metro Station: A local electronics retail store was broken into at 2:30 AM. The suspect, wearing a dark green windbreaker and medical mask, shattered the front glass door and stole retail stock. Disappeared on foot.',
    statements: []
  },
  {
    id: 'case_4',
    crime_type: 'Vandalism',
    location: 'Cubbon Park Entrance',
    coordinates: [12.9763, 77.5929],
    timestamp: '2026-06-14 04:00 PM',
    suspect_description: 'Teenager wearing a bright red backpack, yellow t-shirt, and headphones.',
    vehicle_details: 'None',
    is_organized_crime: false,
    status: 'resolved',
    narrative: 'Cubbon Park Entrance: Public monument spray-painted with graffiti. The individual was spotted wearing a bright red backpack and yellow t-shirt. Suspect was apprehended nearby by park patrol.',
    statements: []
  }
];

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [threatNetworks, setThreatNetworks] = useState<ThreatNetwork[]>(initialThreatNetworks);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>('case_1');
  const [showHotspots, setShowHotspots] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);

  // Compute vehicles log from cases and transcripts
  useEffect(() => {
    const records: VehicleRecord[] = [];
    cases.forEach(c => {
      // Direct vehicle details
      if (c.vehicle_details && c.vehicle_details.toLowerCase() !== 'none') {
        const plateMatch = c.vehicle_details.match(/([A-Z0-9\-]{5,12})/i);
        const plate = plateMatch ? plateMatch[1].toUpperCase() : 'UNKNOWN';
        const existingIdx = records.findIndex(r => r.plate === plate);
        if (existingIdx > -1) {
          if (!records[existingIdx].case_ids.includes(c.id)) {
            records[existingIdx].case_ids.push(c.id);
          }
        } else {
          records.push({
            id: `veh_${Math.random().toString(36).substr(2, 5)}`,
            plate: plate,
            make: c.vehicle_details.includes('SUV') ? 'SUV' : c.vehicle_details.includes('Sedan') ? 'Sedan' : 'vehicle',
            color: c.vehicle_details.includes('Black') ? 'black' : c.vehicle_details.includes('Blue') ? 'blue' : 'unknown',
            case_ids: [c.id],
            last_seen: c.timestamp,
            location: c.location
          });
        }
      }

      // Statement vehicle details
      c.statements.forEach(s => {
        s.extracted_entities.vehicles.forEach(v => {
          const plateMatch = v.match(/([A-Z0-9\-]{5,12})/i);
          const plate = plateMatch ? plateMatch[1].toUpperCase() : '';
          if (plate) {
            const existingIdx = records.findIndex(r => r.plate === plate);
            if (existingIdx > -1) {
              if (!records[existingIdx].case_ids.includes(c.id)) {
                records[existingIdx].case_ids.push(c.id);
              }
            } else {
              records.push({
                id: `veh_${Math.random().toString(36).substr(2, 5)}`,
                plate: plate,
                make: v.toLowerCase().includes('suv') ? 'SUV' : v.toLowerCase().includes('sedan') ? 'Sedan' : 'vehicle',
                color: v.toLowerCase().includes('black') ? 'black' : v.toLowerCase().includes('blue') ? 'blue' : 'unknown',
                case_ids: [c.id],
                last_seen: s.timestamp,
                location: c.location
              });
            }
          }
        });
      });
    });
    setVehicles(records);
  }, [cases]);

  const activeCase = cases.find(c => c.id === selectedCaseId) || null;

  const onAddStatement = (caseId: string, statement: Statement) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          statements: [statement, ...c.statements]
        };
      }
      return c;
    }));
  };

  const onAddCase = (newCase: Case) => {
    setCases(prev => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
  };

  const onToggleCaseStatus = (caseId: string) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status: c.status === 'active' ? 'resolved' : 'active'
        };
      }
      return c;
    }));
  };

  const onDismantleNetwork = (networkId: string) => {
    setThreatNetworks(prev => prev.map(n => {
      if (n.id === networkId) {
        return { ...n, status: 'dismantled' };
      }
      return n;
    }));
  };

  const onDeleteCase = (caseId: string) => {
    setCases(prev => prev.filter(c => c.id !== caseId));
    if (selectedCaseId === caseId) {
      setSelectedCaseId(null);
    }
  };

  const onUpdateCase = (caseId: string, updates: Partial<Case>) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  return (
    <CaseContext.Provider value={{
      cases,
      selectedCaseId,
      setSelectedCaseId,
      threatNetworks,
      showHotspots,
      setShowHotspots,
      vehicles,
      activeCase,
      onAddStatement,
      onAddCase,
      onToggleCaseStatus,
      onDismantleNetwork,
      onDeleteCase,
      onUpdateCase
    }}>
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  return context;
};
