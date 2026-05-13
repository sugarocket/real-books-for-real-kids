from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import os

# --- Pydantic Models ---


class Page(BaseModel):
    pageNum: int
    text: str
    illustration: str


class Book(BaseModel):
    id: int
    title: str
    cover: str
    ageGroup: str
    topic: str
    style: str
    pages: List[Page]


class GenerateRequest(BaseModel):
    keywords: str
    topic: str
    ageGroup: str
    pageCount: int
    illustrationStyle: str
    diversityMode: str


app = FastAPI(title="Real Books API", version="0.1.0")

# CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Sample Books (pre-generated showcase) ---

SAMPLE_BOOKS: List[Book] = [
    Book(
        id=1,
        title="Luna the Little Star",
        cover="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-0d6c62fe-69cd-4584-a44f-ff6287d1bdab.jpeg",
        ageGroup="3-4",
        topic="Space Adventure",
        style="Cartoon Watercolor",
        pages=[
            Page(pageNum=1, text="Once upon a time, there was a little star named Luna who lived in the night sky.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b878860c-5fa5-4d93-89c7-841211b64b16.jpeg"),
            Page(pageNum=2, text="Luna was lonely. All the other stars had friends to twinkle with.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-851bee2d-ccba-4cbf-ad54-5effe883c03e.jpeg"),
            Page(pageNum=3, text="One night, Luna saw a little girl looking up at the sky from her window.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-ea69cd30-490f-482a-92d2-9a257815b93a.jpeg"),
            Page(pageNum=4, text="Luna floated down gently and landed on the girl's windowsill.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-dedd1575-e0db-4627-9c2d-7952125cfa1f.jpeg"),
            Page(pageNum=5, text="The girl and Luna became best friends. They told stories every night.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d6fb1e5f-4790-41d4-9505-6c7835112de9.jpeg"),
        ],
    ),
    Book(
        id=2,
        title="Nature & Animals: Our Earth Day Adventure",
        cover="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b2cd66ec-e395-4992-82b9-8c76871e6a83.jpeg",
        ageGroup="5-6",
        topic="Nature & Animals",
        style="Cute Hand-drawn",
        pages=[
            Page(pageNum=1, text="Today is Earth Day! We love our planet and all its animals.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-3d5e6e55-aec3-4eb3-8254-d9ebebef9e8e.jpeg"),
            Page(pageNum=2, text="Trees give us air to breathe. Let's hug a tree today!", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-f8d2fd46-5da3-4094-94f0-46fca76d84f5.jpeg"),
            Page(pageNum=3, text="Recycling helps our planet. We can recycle paper and plastic!", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b3c22056-7dfd-4eb4-99ee-55edaee09aa8.jpeg"),
            Page(pageNum=4, text="Animals need our help. We can protect them by not littering.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-5237a82d-e166-4eb3-9449-0ff57d6f3085.jpeg"),
            Page(pageNum=5, text="Let's promise to care for Earth every day, not just on Earth Day!", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-af9587cb-a643-4f30-b11f-547917b65924.jpeg"),
        ],
    ),
    Book(
        id=3,
        title="My Family",
        cover="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-1699f68a-d20d-4e3a-9a8b-2bc05f8da201.jpeg",
        ageGroup="3-4",
        topic="Family",
        style="Bright Cartoon",
        pages=[
            Page(pageNum=1, text="Family means love. I have two dads, Papa and Daddy.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-4d87fdb9-a283-4946-8a0f-5aba4e5bb26d.jpeg"),
            Page(pageNum=2, text="Papa and Daddy take care of me. They read me stories.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-9f1c5712-37a7-4cb9-8558-dca4aed0b45c.jpeg"),
            Page(pageNum=3, text="We all have big hearts full of love for each other.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b8125392-c475-4944-acc5-e658e43a7f76.jpeg"),
            Page(pageNum=4, text="Every family is special. My family is my heart.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-e1b563c5-cd51-4e60-a716-ef884afd15db.jpeg"),
        ],
    ),
    Book(
        id=4,
        title="Magical Sky Adventure",
        cover="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-ba3b52a4-d65a-4db3-bdc4-51fe47ad4733.jpeg",
        ageGroup="5-6",
        topic="Fantasy",
        style="Cartoon Watercolor",
        pages=[
            Page(pageNum=1, text="Once upon a time, in a land of clouds, lived a whale who loved to play.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-0bd2d2a6-1486-4480-8e0a-fee9df65b1f6.jpeg"),
            Page(pageNum=2, text="One day, the whale saw children riding stars across the sky.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-c8a08fdd-04e2-4700-a3a6-74c8d0099fa2.jpeg"),
            Page(pageNum=3, text="The whale joined them, and together they explored the magical sky.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-31276f4e-cf31-4ece-b1cc-43ce02551df2.jpeg"),
            Page(pageNum=4, text="They found a castle made of rainbows and had a big feast.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-4ac501e0-b2b8-4193-83ef-07fee36581ee.jpeg"),
            Page(pageNum=5, text="The whale and the star children promised to have more adventures soon.", illustration="https://imgen.x.ai/xai-imgen/xai-tmp-imgen-fe2937bb-9f9d-4ffd-a8e3-2da6069497a3.jpeg"),
        ],
    ),
]


@app.get("/api/books", response_model=List[Book])
def list_books():
    return SAMPLE_BOOKS


@app.get("/api/books/{book_id}", response_model=Book)
def get_book(book_id: int):
    for b in SAMPLE_BOOKS:
        if b.id == book_id:
            return b
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Book not found")


# --- Grok Story Generation (Phase 2) ---

import httpx
import json
import re
import os

XAI_API_KEY = os.getenv("XAI_API_KEY", "")
XAI_API_URL = "https://api.x.ai/v1/chat/completions"
XAI_MODEL = "grok-2-mini-latest"

STORY_PROMPT_TEMPLATE = """Write EXACTLY {pageCount} pages for age {ageGroup} on topic "{topic}" with keywords "{keywords}". Diversity: {diversityMode}. Age-appropriate, coherent, positive, no violence. Each page text: ≤25 words (1-2 short sentences).

Return ONLY this JSON: {{"title": "...", "pages": [{{"pageNum": 1, "text": "short text ≤25 words"}}, ...]}} with exactly {pageCount} pages.
"""


def generate_story_with_grok(req: GenerateRequest) -> dict:
    """Call xAI API to generate story JSON, parse and return dict."""
    prompt = STORY_PROMPT_TEMPLATE.format(
        pageCount=req.pageCount,
        topic=req.topic,
        ageGroup=req.ageGroup,
        keywords=req.keywords,
        diversityMode=req.diversityMode,
    )

    with httpx.Client(timeout=60) as client:
        resp = client.post(
            XAI_API_URL,
            headers={
                "Authorization": f"Bearer {XAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": XAI_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1000,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    raw_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

    # Strip markdown if present
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", raw_text, re.DOTALL)
    inner = match.group(1) if match else raw_text

    story = json.loads(inner)
    return story


# --- Image Generation (Phase 3) ---

IMAGE_API_URL = "https://api.x.ai/v1/images/generations"


def build_image_prompt(
    style: str,
    story_text: str,
    keywords: str,
    topic: str,
    diversity_mode: str,
    character_desc: str = "",
) -> str:
    """Expand brief inputs into a rich, aesthetic image prompt."""
    style_phrase = f"{style} illustration" if style not in ("Random ✨", "Cartoon") else "Children's book illustration"

    diversity_phrase = ""
    if diversity_mode and diversity_mode.lower() not in ("none", ""):
        if "multicultural" in diversity_mode.lower():
            diversity_phrase = "diverse characters from different cultures and backgrounds, "
        elif "ability" in diversity_mode.lower():
            diversity_phrase = "a child with a visible disability included naturally, "
        elif "mixed" in diversity_mode.lower() or "family" in diversity_mode.lower():
            diversity_phrase = "a loving non-traditional family, "
        elif "global" in diversity_mode.lower() or "tradition" in diversity_mode.lower():
            diversity_phrase = "cultural traditions and global diversity visible, "
        else:
            diversity_phrase = f"{diversity_mode} representation for educational purpose, "

    char_phrase = f"Featuring {character_desc}. " if character_desc else ""
    scene = story_text
    aesthetic = "Beautiful composition, soft lighting, rich textures, high aesthetic quality, whimsical and inviting for children."

    return f"{style_phrase} of {diversity_phrase}{char_phrase}{scene} {aesthetic}"


def generate_image(prompt: str) -> str:
    """Call xAI image API, return image URL (or fallback placeholder)."""
    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                IMAGE_API_URL,
                headers={
                    "Authorization": f"Bearer {XAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"prompt": prompt, "n": 1},
            )
            resp.raise_for_status()
            data = resp.json()
        url = data.get("data", [{}])[0].get("url", "")
        if url:
            return url
    except Exception:
        pass
    # Fallback placeholder
    return "https://picsum.photos/id/1015/600/400"


# --- Generate Endpoint (now uses real Grok + Images) ---

@app.post("/api/books/generate", response_model=Book)
def generate_book(req: GenerateRequest):
    # Call Grok for story
    story = generate_story_with_grok(req)

    title = story.get("title", f"{req.keywords.split()[0]} {req.topic}")
    pages_raw = story.get("pages", [])

    # Create consistent character description from keywords + topic
    character_desc = f"the main character: {req.keywords} in a {req.topic.lower()} setting"

    # Style (handle Random)
    style = req.illustrationStyle if req.illustrationStyle != "Random ✨" else "Cartoon"

    # --- Cover Image ---
    cover_prompt = build_image_prompt(
        style=style,
        story_text="",
        keywords=req.keywords,
        topic=req.topic,
        diversity_mode=req.diversityMode,
        character_desc=character_desc,
    )
    cover_url = generate_image(cover_prompt)

    # --- Page Images ---
    pages: List[Page] = []
    for p in pages_raw:
        page_num = p.get("pageNum", len(pages) + 1)
        text = " ".join(p.get("text", "").split()[:25])

        page_prompt = build_image_prompt(
            style=style,
            story_text=text,
            keywords=req.keywords,
            topic=req.topic,
            diversity_mode=req.diversityMode,
            character_desc=character_desc,
        )
        illustration_url = generate_image(page_prompt)

        pages.append(Page(
            pageNum=page_num,
            text=text,
            illustration=illustration_url,
        ))

    # Deterministic ID
    import hashlib
    seed = int(hashlib.md5(f"{req.keywords}{req.topic}{req.ageGroup}".encode()).hexdigest()[:8], 16)

    return Book(
        id=seed,
        title=title,
        cover=cover_url,
        ageGroup=req.ageGroup,
        topic=req.topic,
        style=style,
        pages=pages,
    )


# --- TTS Endpoint (Grok Voice) ---
from pydantic import BaseModel

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "eve"
    language: str = "en"

@app.post("/api/tts")
async def tts(req: TTSRequest):
    """Proxy to xAI /v1/tts, returns audio bytes."""
    import httpx
    from fastapi import Response
    if not req.text:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No text provided")
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.x.ai/v1/tts",
            headers={"Authorization": f"Bearer {XAI_API_KEY}", "Content-Type": "application/json"},
            json={"text": req.text, "voice_id": req.voice_id, "language": req.language},
        )
        resp.raise_for_status()
        return Response(content=resp.content, media_type="audio/mpeg")


# --- Image Proxy (bypasses CORS for xAI images) ---
@app.get("/api/image")
async def proxy_image(url: str):
    from fastapi import Response
    import httpx
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return Response(content=resp.content, media_type=resp.headers.get("content-type", "image/jpeg"))


# Serve built frontend (SPA fallback)
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
