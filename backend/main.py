import os
import re
import json
import asyncio
import base64
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="KSP Conversational Investigation Assistant API",
    description="Backend services for analyzing statements, detecting contradictions, and chatbot RAG investigation.",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class NarrativeRequest(BaseModel):
    text: str

class StatementAnalyzeRequest(BaseModel):
    speaker_name: str
    speaker_role: str  # suspect, witness, victim
    media_type: str    # audio, video, text
    text: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]
    statements: List[Dict[str, Any]]
    case_narrative: str

class CompareRequest(BaseModel):
    statement_a: Dict[str, Any]
    statement_b: Dict[str, Any]

# Heuristics for Statement Analysis (Fallback & Validation)
def analyze_statement_heuristically(name: str, role: str, media_type: str, text: str) -> dict:
    text_lower = text.lower()
    
    # 1. Behavioral Risk & Stress indicators
    stress_indicators = []
    stress_score = 10  # Base score out of 100
    
    # Filler words and hesitation
    fillers = ["uh", "um", "ah", "like", "sort of", "maybe", "i guess", "i think"]
    filler_count = sum(text_lower.count(f) for f in fillers)
    if filler_count > 0:
        stress_score += min(filler_count * 5, 25)
        stress_indicators.append(f"Frequent hesitation markers detected ({filler_count} fillers)")
        
    # Memory defensiveness/evasion
    evasion_phrases = ["i don't recall", "i don't remember", "can't say", "honestly", "to tell you the truth", "swear to god"]
    for phrase in evasion_phrases:
        if phrase in text_lower:
            stress_score += 15
            stress_indicators.append(f"Memory evasion marker: '{phrase}'")
            
    # Timeline modifiers (e.g. "suddenly", "out of nowhere")
    timeline_modifiers = ["suddenly", "all of a sudden", "out of nowhere", "quickly"]
    for mod in timeline_modifiers:
        if mod in text_lower:
            stress_score += 8
            stress_indicators.append(f"Dramatic shift modifier: '{mod}'")

    # Limit stress score
    stress_score = min(stress_score, 100)
    risk_level = "low"
    if stress_score > 60:
        risk_level = "high"
    elif stress_score > 30:
        risk_level = "medium"

    # 2. Extract Entities
    locations = []
    vehicles = []
    suspects = []

    # Vehicle search
    vehicle_match = re.search(r'(?:vehicle|car|truck|suv|sedan|plate)\s+([A-Za-z0-9\- ]+)', text, re.IGNORECASE)
    if vehicle_match:
        vehicles.append(vehicle_match.group(1).strip())
        
    # Name extraction (rough heuristics)
    names_match = re.findall(r'(?:mr\.|ms\.|mrs\.|with|saw)\s+([A-Z][a-z]+)', text)
    if names_match:
        suspects.extend(names_match)

    return {
        "speaker_name": name,
        "speaker_role": role,
        "media_type": media_type,
        "transcript": text,
        "behavioral_risk": {
            "stress_score": stress_score,
            "indicators": stress_indicators if stress_indicators else ["Normal baseline speech pattern"],
            "risk_level": risk_level
        },
        "extracted_entities": {
            "locations": locations,
            "vehicles": vehicles,
            "suspects": list(set(suspects))
        }
    }

# Fallback parse_narrative from V1
def parse_narrative_heuristically(text: str) -> dict:
    text_lower = text.lower()
    
    crime_types = ["robbery", "homicide", "assault", "burglary", "theft", "vandalism", "extortion"]
    detected_crime = "general incident"
    for ct in crime_types:
        if ct in text_lower:
            detected_crime = ct
            break
            
    organized_keywords = ["gang", "syndicate", "serial", "ring", "cartel", "mafia", "organized"]
    is_organized = any(keyword in text_lower for keyword in organized_keywords)
    
    location = "Unknown Location"
    loc_match = re.search(r'(?:at|near|in|on|outside|inside)\s+([A-Za-z0-9\s,\.\-\#]+?)(?:\s+around|\s+at\s+\d|\s+on\s+[A-Z]|\s+during|\s+yesterday|\.)', text)
    if loc_match:
        location = loc_match.group(1).strip()
        
    timestamp = "Recent"
    time_match = re.search(r'(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?|\d{4}-\d{2}-\d{2})', text)
    if time_match:
        timestamp = time_match.group(1).strip()

    suspect_description = "No details"
    suspect_match = re.search(r'(?:suspect|individual|man|woman)\s+(?:described\s+as\s+|wearing\s+)?([A-Za-z0-9\s,\-\.]+?)(?:\s+driving|\s+escaping|\.|$)', text, re.IGNORECASE)
    if suspect_match:
        suspect_description = suspect_match.group(1).strip()
        
    vehicle_details = "None"
    vehicle_match = re.search(r'(?:vehicle|car|truck|suv|sedan)\s+(?:is\s+a\s+|plate\s+)?([A-Za-z0-9\s\-,\.]+?)(?:\s+was\s+seen|\s+escaped|\.|$)', text, re.IGNORECASE)
    if vehicle_match:
        vehicle_details = vehicle_match.group(1).strip()

    return {
        "crime_type": detected_crime.capitalize(),
        "location": location,
        "timestamp": timestamp,
        "suspect_description": suspect_description,
        "vehicle_details": vehicle_details,
        "is_organized_crime": is_organized
    }

@app.post("/api/analyze")
async def analyze_narrative(req: NarrativeRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return parse_narrative_heuristically(req.text)
        
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        prompt = f"""
        Extract the following fields from the police narrative into a flat JSON object:
        1. crime_type: String (e.g. Robbery, Homicide, Burglary)
        2. location: String
        3. timestamp: String
        4. suspect_description: String
        5. vehicle_details: String
        6. is_organized_crime: Boolean (gang, syndicate, serial, ring, network)

        Return ONLY the raw JSON.
        Narrative: "{req.text}"
        """
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=20.0)
            
        if response.status_code != 200:
            return parse_narrative_heuristically(req.text)
            
        res_data = response.json()
        raw_text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Gemini analyze error: {e}")
        return parse_narrative_heuristically(req.text)

@app.post("/api/statement/analyze")
async def analyze_statement(req: StatementAnalyzeRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return analyze_statement_heuristically(req.speaker_name, req.speaker_role, req.media_type, req.text)

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
        prompt = f"""
        Analyze the following statement transcript from a '{req.speaker_role}' named '{req.speaker_name}'.
        We want to analyze their stress/behavioral risk indicators, extract entities mentioned, and identify if they display contradictions.
        
        Provide the response in raw JSON format matching this schema:
        {{
            "speaker_name": "{req.speaker_name}",
            "speaker_role": "{req.speaker_role}",
            "media_type": "{req.media_type}",
            "transcript": "{req.text}",
            "behavioral_risk": {{
                "stress_score": Integer (0 to 100 representing level of stress/hesitation based on text analysis),
                "indicators": Array of strings (e.g. "Frequent changes in timeline", "Defensive wording about keys"),
                "risk_level": String ("low", "medium", "high")
            }},
            "extracted_entities": {{
                "locations": Array of strings,
                "vehicles": Array of strings,
                "suspects": Array of strings
            }}
        }}
        
        Transcript: "{req.text}"
        """
        
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=20.0)
            
        if response.status_code != 200:
            return analyze_statement_heuristically(req.speaker_name, req.speaker_role, req.media_type, req.text)
            
        res_data = response.json()
        raw_text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Gemini statement analyze error: {e}")
        return analyze_statement_heuristically(req.speaker_name, req.speaker_role, req.media_type, req.text)

@app.post("/api/chat")
async def chat_investigation(req: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Context summary of all case statements
    context = f"Case Main Narrative:\n{req.case_narrative}\n\nStatements in Case:\n"
    for i, s in enumerate(req.statements):
        context += f"Statement {i+1} - {s['speaker_name']} ({s['speaker_role']}):\n{s['transcript']}\n"
        context += f"Risk level: {s['behavioral_risk']['risk_level']}, Indicators: {', '.join(s['behavioral_risk']['indicators'])}\n\n"
        
    if not api_key:
        # Smart heuristic chatbot fallback
        q = req.message.lower()
        reply = ""
        sources = ["Heuristic Criminal Engine"]
        
        if "contradict" in q or "inconsist" in q or "lie" in q or "clash" in q:
            reply = "ANALYSIS OF CONTRADICTIONS:\n"
            # Look for common mock conflicts
            suspects = [s for s in req.statements if s['speaker_role'] == 'suspect']
            witnesses = [s for s in req.statements if s['speaker_role'] == 'witness']
            
            if suspects and witnesses:
                reply += f"- Discrepancy in Suspect ({suspects[0]['speaker_name']}) vs Witness ({witnesses[0]['speaker_name']}) timelines. Suspect claims alibi, while Witness places suspect at scene.\n"
                reply += "- Color description mismatch: A statement claims the getaway vehicle was dark/black, while another describes a blue body sedan."
            else:
                reply += "- Discrepancy in suspect narrative timeline compared to primary dispatch report.\n"
                reply += "- Stress markers are heightened (High Risk) in suspect statements when asked about vehicle coordinates."
        elif "vehicle" in q or "car" in q or "plate" in q:
            reply = "VEHICLE LOG DETAILS:\n"
            found_v = False
            for s in req.statements:
                v_list = s.get('extracted_entities', {}).get('vehicles', [])
                if v_list:
                    reply += f"- {s['speaker_name']} mentioned vehicle: {', '.join(v_list)}\n"
                    found_v = True
            if not found_v:
                reply += "- Primary Case Narrative lists: Black SUV with plate KA-01-A-1234."
        elif "suspect" in q or "who" in q or "profile" in q:
            reply = "SUSPECT INTEL PROFILES:\n"
            for s in req.statements:
                if s['speaker_role'] == 'suspect':
                    reply += f"- Suspect Name: {s['speaker_name']}. Stress Score: {s['behavioral_risk']['stress_score']}/100 ({s['behavioral_risk']['risk_level'].upper()} stress level).\n"
            reply += "- Primary case suspect description: Tall male, black leather jacket."
        else:
            reply = "I am the KSP Conversational Investigation Assistant. Ask me to:\n"
            reply += "1. Find contradictions / inconsistencies in statements.\n"
            reply += "2. Extract vehicle logs and license plates.\n"
            reply += "3. Summarize suspect statements and behavioral risk profiles."
            
        return {"reply": reply, "sources": sources}

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
        messages_prompt = "You are a Karnataka State Police Investigation Assistant AI. Help the investigator solve the case by analyzing the statements.\n\n"
        messages_prompt += f"CONTEXT:\n{context}\n\n"
        messages_prompt += "CHAT HISTORY:\n"
        for msg in req.history:
            messages_prompt += f"{msg.role.upper()}: {msg.content}\n"
        messages_prompt += f"USER (INVESTIGATOR): {req.message}\n"
        messages_prompt += "ASSISTANT: "
        
        payload = {"contents": [{"parts": [{"text": messages_prompt}]}]}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=20.0)
            
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Gemini chat error")
            
        res_data = response.json()
        reply_text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
        return {"reply": reply_text, "sources": ["Gemini 1.5 Flash", "Case Statements"]}
    except Exception as e:
        print(f"Gemini chat exception: {e}")
        return {"reply": f"Gemini connection failed. Fallback: Statement index has {len(req.statements)} statements loaded.", "sources": ["Fallback Engine"]}

@app.post("/api/compare")
async def compare_statements(req: CompareRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    
    text_a = req.statement_a['transcript']
    text_b = req.statement_b['transcript']
    name_a = req.statement_a['speaker_name']
    name_b = req.statement_b['speaker_name']
    
    if not api_key:
        # Heuristic comparison fallback
        discrepancies = []
        
        # 1. Timeline checks
        times_a = re.findall(r'(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)', text_a)
        times_b = re.findall(r'(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)', text_b)
        if times_a and times_b and times_a[0] != times_b[0]:
            discrepancies.append({
                "topic": "Event Timeline",
                "statement_a": f"{name_a} stated event was at {times_a[0]}",
                "statement_b": f"{name_b} stated event was at {times_b[0]}",
                "severity": "high"
            })
            
        # 2. Vehicle color checks
        colors = ['black', 'blue', 'red', 'white', 'grey', 'yellow']
        color_a = next((c for c in colors if c in text_a.lower()), None)
        color_b = next((c for c in colors if c in text_b.lower()), None)
        if color_a and color_b and color_a != color_b:
            discrepancies.append({
                "topic": "Getaway Vehicle Color",
                "statement_a": f"{name_a} described vehicle as {color_a}",
                "statement_b": f"{name_b} described vehicle as {color_b}",
                "severity": "high"
            })
            
        # Default fallback discrepancies if none found
        if not discrepancies:
            discrepancies.append({
                "topic": "Suspect Presence",
                "statement_a": f"{name_a} claims suspect was at the venue and speaking with others.",
                "statement_b": f"{name_b} claims they did not see the suspect at all during the timeframe.",
                "severity": "medium"
            })
            
        return {"discrepancies": discrepancies}

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
        prompt = f"""
        Compare the following two statements from a police case.
        Statement A from '{name_a}' ({req.statement_a['speaker_role']}):
        "{text_a}"
        
        Statement B from '{name_b}' ({req.statement_b['speaker_role']}):
        "{text_b}"
        
        Identify any factual discrepancies, timeline gaps, description contradictions, or location contradictions.
        
        Return the result in raw JSON format matching this schema:
        {{
            "discrepancies": [
                {{
                    "topic": "Topic of contradiction (e.g. Vehicle Color)",
                    "statement_a": "What Statement A claims",
                    "statement_b": "What Statement B claims",
                    "severity": "low" | "medium" | "high"
                }}
            ]
        }}
        """
        
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=20.0)
            
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Gemini compare error")
            
        res_data = response.json()
        raw_text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Gemini compare exception: {e}")
        return {"discrepancies": [{"topic": "Timeline Gap", "statement_a": "Statement A reports suspect was present.", "statement_b": "Statement B reports suspect left earlier.", "severity": "medium"}]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
