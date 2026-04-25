from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = FastAPI(title="CRM AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LeadData(BaseModel):
    email: str
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    message: Optional[str] = None

class LeadScoreRequest(BaseModel):
    leads: List[LeadData]

class DuplicateCheckRequest(BaseModel):
    new_lead: LeadData
    existing_leads: List[LeadData]

class DealPredictRequest(BaseModel):
    stage: str
    interactions: int
    days_in_stage: int

class NoteSummarizeRequest(BaseModel):
    note: str

class EnhanceNoteRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"status": "ok", "service": "CRM AI Service"}

@app.post("/ai/score-lead")
async def score_lead(request: LeadScoreRequest):
    scores = []
    
    high_intent_keywords = ["urgent", "budget", "buy", "purchase", "demo", "asap", "ready", "price", "pricing"]
    
    for lead in request.leads:
        score = 30 # Base score
        
        if lead.company:
            score += 15
        if lead.phone:
            score += 10
        if lead.source in ['referral', 'linkedin']:
            score += 15
        elif lead.source == 'website':
            score += 5
            
        if '@' in lead.email and not any(domain in lead.email.lower() for domain in ['gmail.com', 'yahoo.com', 'hotmail.com']):
            score += 15 # Corporate email bonus
            
        if lead.message:
            msg_lower = lead.message.lower()
            keyword_matches = sum(1 for kw in high_intent_keywords if kw in msg_lower)
            score += min(keyword_matches * 10, 30) # Up to 30 points for keywords
            
        final_score = min(score, 100)
        
        priority = "LOW"
        if final_score >= 70:
            priority = "HIGH"
        elif final_score >= 40:
            priority = "MEDIUM"
            
        scores.append({
            "email": lead.email,
            "score": final_score,
            "priority": priority
        })
    
    return {"scores": scores}

@app.post("/ai/detect-duplicate")
async def detect_duplicate(request: DuplicateCheckRequest):
    new_lead = request.new_lead
    
    if not request.existing_leads:
        return {"is_duplicate": False, "duplicates": []}
        
    # Exact email match is an automatic duplicate
    for lead in request.existing_leads:
        if lead.email.lower() == new_lead.email.lower():
            return {
                "is_duplicate": True, 
                "duplicates": [{"email": lead.email, "name": lead.name, "similarity_score": 100}]
            }
            
    # Fuzzy matching using TF-IDF and Cosine Similarity
    def make_doc(l: LeadData) -> str:
        return f"{l.name or ''} {l.company or ''}".lower().strip()
        
    new_doc = make_doc(new_lead)
    if not new_doc:
        return {"is_duplicate": False, "duplicates": []}
        
    existing_docs = [make_doc(l) for l in request.existing_leads]
    
    vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4))
    try:
        tfidf_matrix = vectorizer.fit_transform([new_doc] + existing_docs)
        cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        duplicates = []
        is_dup = False
        
        for idx, similarity in enumerate(cosine_similarities):
            sim_score = int(similarity * 100)
            if sim_score >= 75: # 75% similarity threshold
                is_dup = True
                duplicates.append({
                    "email": request.existing_leads[idx].email,
                    "name": request.existing_leads[idx].name,
                    "similarity_score": sim_score
                })
                
        return {"is_duplicate": is_dup, "duplicates": duplicates}
    except ValueError:
        # Happens if vocab is empty
        return {"is_duplicate": False, "duplicates": []}

@app.post("/ai/summarize-note")
async def summarize_note(request: NoteSummarizeRequest):
    # Extractive heuristic summarization
    text = request.note
    if not text or len(text.strip()) < 20:
        return {"summary": text}
        
    # Remove filler words and clean up
    cleaned = re.sub(r'\s+', ' ', text).strip()
    
    # Extract important sentences (heuristic: contains keywords or numbers)
    sentences = re.split(r'(?<=[.!?]) +', cleaned)
    
    important_keywords = ['budget', 'price', 'cost', 'buy', 'issue', 'problem', 'need', 'want', 'competitor']
    
    summary_sentences = []
    for s in sentences:
        s_lower = s.lower()
        if any(kw in s_lower for kw in important_keywords) or any(char.isdigit() for char in s):
            summary_sentences.append(s)
            
    if not summary_sentences:
        # fallback to just truncating
        summary = " ".join(cleaned.split()[:20]) + "..."
    else:
        summary = " ".join(summary_sentences[:3]) # Top 3 important sentences
        
    # Very rudimentary "AI" extraction to make it look clean
    prefix = "AI Insight: "
    if "budget" in summary.lower() or "$" in summary:
        prefix = "💰 Budget/Pricing Note: "
    elif "issue" in summary.lower() or "problem" in summary.lower():
        prefix = "⚠️ Pain Point Identified: "
        
    return {"summary": prefix + summary}

@app.post("/ai/enhance-note")
async def enhance_note(request: EnhanceNoteRequest):
    text = request.text
    if not text:
        return {"enhanced_text": ""}
        
    corrections = {
        r'\bteh\b': 'the', r'\bimrpovment\b': 'improvement', r'\bu\b': 'you',
        r'\bur\b': 'your', r'\bplz\b': 'please', r'\bcant\b': 'cannot',
        r'\bwont\b': 'will not', r'\bgonna\b': 'going to', r'\bwanna\b': 'want to',
        r'\bthx\b': 'thank you', r'\bcoz\b': 'because', r'\bcuz\b': 'because',
        r'\bi\b': 'I', r'\bmuch\b': 'significantly', r'\bguy\b': 'contact',
        r'\bi will\b': 'I will', r'\bdont\b': 'do not', r'\bisnt\b': 'is not'
    }
    
    vocab_upgrades = {
        r'\bvery good\b': 'exceptional', r'\bgood\b': 'promising', r'\bbad\b': 'suboptimal',
        r'\bwant\b': 'request', r'\bbuy\b': 'purchase', r'\bneed\b': 'require',
        r'\btalked to\b': 'consulted with', r'\bgot\b': 'acquired',
        r'\bhappy\b': 'satisfied', r'\bsad\b': 'dissatisfied', r'\bhelp\b': 'assist',
        r'\btry\b': 'endeavor', r'\bshow\b': 'demonstrate', r'\bgive\b': 'provide',
        r'\btell\b': 'inform', r'\bthink\b': 'anticipate', r'\bso\b': 'consequently'
    }
    
    # 3. Proper Sentence structure (capitalization)
    def capitalize_sentences(s):
        return re.sub(r'(^|[.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), s)

    enhanced = capitalize_sentences(text)
    
    for pattern, replacement in corrections.items():
        enhanced = re.sub(pattern, replacement, enhanced, flags=re.IGNORECASE)
        
    for pattern, replacement in vocab_upgrades.items():
        enhanced = re.sub(pattern, replacement, enhanced, flags=re.IGNORECASE)
        
    # Final check: Ensure the first letter of the whole text is capitalized
    if enhanced:
        enhanced = enhanced[0].upper() + enhanced[1:]
    
    return {"enhanced_text": enhanced}

@app.post("/ai/predict-deal")
async def predict_deal(request: DealPredictRequest):
    base_probs = {
        'new': 10,
        'contacted': 25,
        'demo': 50,
        'negotiation': 75,
        'closed_won': 100,
        'closed_lost': 0
    }
    
    prob = base_probs.get(request.stage, 10)
    
    if request.stage in ['closed_won', 'closed_lost']:
        return {"success_probability": prob}
        
    # More interactions = higher probability (diminishing returns)
    interaction_bonus = min(request.interactions * 5, 25)
    prob += interaction_bonus
    
    # Longer idle time = lower probability
    if request.days_in_stage > 14:
        prob -= 20
    elif request.days_in_stage > 7:
        prob -= 10
        
    final_prob = max(1, min(int(prob), 99))
    
    return {"success_probability": final_prob}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)