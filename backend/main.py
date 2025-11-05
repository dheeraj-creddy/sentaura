from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
#import anthropic
import openai
from typing import List, Optional

load_dotenv()

app = FastAPI()

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize API clients
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Choose which API to use (can switch between them)
USE_API = os.getenv("USE_API", "openai")  # Options: "openai", "anthropic"
USE_API="openai"

class TextInput(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    sentiment: float  # -1.0 to 1.0 (negative to positive)
    emotion: str  # primary emotion
    keywords: List[str]
    intensity: float  # 0.0 to 1.0
    valence: float  # emotional valence


def extract_sentiment_openai(text: str) -> dict:
    """Extract sentiment using OpenAI API"""
    client = openai.OpenAI(api_key=OPENAI_API_KEY)

    prompt = f"""Analyze the emotional sentiment of the following text and return ONLY a JSON object with these exact fields:

Text: "{text}"

Return format:
{{
    "sentiment": <float between -1.0 (very negative) and 1.0 (very positive)>,
    "emotion": "<primary emotion: joy, sadness, anger, fear, surprise, disgust, neutral>",
    "keywords": [<array of 3-5 key topics/words from the text>],
    "intensity": <float between 0.0 (calm) and 1.0 (intense)>,
    "valence": <float between -1.0 (unpleasant) and 1.0 (pleasant)>
}}

Return ONLY the JSON, no other text."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a sentiment analysis expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )

        result = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]

        import json
        return json.loads(result)
    except Exception as e:
        print(f"OpenAI API error: {e}")
        raise

@app.get("/")
async def root():
    return {"message": "Sentiment Aura API", "status": "running", "api": USE_API}


@app.post("/process_text")
async def process_text(input_data: TextInput):
    """
    Process text through AI model to extract sentiment and keywords
    """
    if not input_data.text or len(input_data.text.strip()) < 2:
        raise HTTPException(status_code=400, detail="Text is too short")

    try:
        # Call appropriate API based on configuration
        if USE_API == "openai" and OPENAI_API_KEY:
            result = extract_sentiment_openai(input_data.text)
        else:
            raise HTTPException(
                status_code=500,
                detail=f"API not configured. Set {USE_API.upper()}_API_KEY in .env"
            )

        # Validate response structure
        required_fields = ["sentiment", "emotion", "keywords", "intensity", "valence"]
        for field in required_fields:
            if field not in result:
                result[field] = 0.0 if field != "keywords" else []

        return result

    except Exception as e:
        print(f"Error processing text: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "api_configured": bool(OPENAI_API_KEY), # or ANTHROPIC_API_KEY or GEMINI_API_KEY),
        "using_api": USE_API
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)