from openai import OpenAI
import os
import json
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_conflict_and_suggest(event, existing_events):
    """
    Uses AI to analyze conflicts between an event and existing events
    and suggests better free time slots (in JSON).
    """
    prompt = f"""
    You are an intelligent scheduling assistant.
    The user wants to add this event:
    {json.dumps(event, indent=2)}

    The user's existing events are:
    {json.dumps(existing_events, indent=2)}

    If there are conflicts or overlaps, suggest up to 3 better free time slots 
    (on the same or nearby day).
    Return only valid JSON in this format:
    [
      {{
        "start": "YYYY-MM-DDTHH:MM",
        "end": "YYYY-MM-DDTHH:MM",
        "reason": "short explanation"
      }}
    ]
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    content = response.choices[0].message.content.strip()

    try:
        suggestions = json.loads(content)
    except Exception:
        suggestions = [{"error": "Failed to parse AI output", "raw": content}]

    return suggestions
