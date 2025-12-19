import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from fastapi import FastAPI
from pydantic import BaseModel
from diffusers import StableDiffusionPipeline
import torch
from io import BytesIO
import base64

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow Vercel
    allow_credentials=True,
    allow_methods=["*"],  # enables OPTIONS
    allow_headers=["*"],
)

# Load model
print("🔄 Loading Stable Diffusion model...")
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
)
pipe.to("cuda" if torch.cuda.is_available() else "cpu")
print("✅ Model loaded successfully")

class PromptRequest(BaseModel):
    prompt: str

@app.get("/")
def home():
    return {"message": "Varnika AI Backend Running with Stable Diffusion"}


# ✅ OPTIONS handler (CRITICAL)
@app.options("/generate")
async def options_generate():
    return {}

@app.post("/generate")
def generate(req: PromptRequest):
    prompt = req.prompt
    image = pipe(prompt).images[0]
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return {"image_base64": img_base64}
