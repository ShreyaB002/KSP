export interface Statement {
  id: string;
  speaker_name: string;
  speaker_role: 'suspect' | 'witness' | 'victim';
  media_type: 'audio' | 'video' | 'text';
  transcript: string;
  behavioral_risk: {
    stress_score: number;
    indicators: string[];
    risk_level: 'low' | 'medium' | 'high';
  };
  extracted_entities: {
    locations: string[];
    vehicles: string[];
    suspects: string[];
  };
  timestamp: string;
}

export interface Case {
  id: string;
  crime_type: string;
  location: string;
  coordinates: [number, number];
  timestamp: string;
  suspect_description: string;
  vehicle_details: string;
  is_organized_crime: boolean;
  status: 'active' | 'resolved';
  narrative: string;
  sketch_url?: string;
  threat_network_id?: string;
  statements: Statement[];
}

export interface ThreatNetwork {
  id: string;
  name: string;
  status: 'active' | 'dismantled';
  cases: string[];
  suspects: string[];
  vehicles: string[];
}

export interface VehicleRecord {
  id: string;
  plate: string;
  make: string;
  color: string;
  case_ids: string[];
  last_seen: string;
  location: string;
}

export interface CoordinateHotspot {
  coordinates: [number, number];
  intensity: number;
  crime_type: string;
}

export interface Discrepancy {
  topic: string;
  statement_a: string;
  statement_b: string;
  severity: 'low' | 'medium' | 'high';
}
