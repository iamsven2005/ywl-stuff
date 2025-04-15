from flask import Flask, request, jsonify
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
import io
from FlagEmbedding import FlagModel
import torch.nn.functional as F
app = Flask(__name__)

device = "cuda" if torch.cuda.is_available() else "cpu"
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)
model2 = FlagModel("BAAI/bge-base-en", use_fp16=torch.cuda.is_available())
model.eval()
@app.route("/analyze", methods=["POST"])
def analyze_image():
    image_bytes = request.data
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = processor(image, return_tensors="pt").to(device)

    # Caption
    out = model.generate(**inputs)
    caption = processor.decode(out[0], skip_special_tokens=True)

    # Embedding
    with torch.no_grad():
        encoder_outputs = model.vision_model(**inputs)
        cls_embedding = encoder_outputs.last_hidden_state[:, 0, :].squeeze().tolist()

    return jsonify({
        "caption": caption,
        "embedding": cls_embedding
    })
    
@app.route("/embed", methods=["POST"])
def embed_text():
    data = request.get_json()
    texts = data.get("texts", [])

    if not texts:
        return jsonify({"error": "No text provided"}), 400
    prompt = "Represent this sentence for semantic search:"
    embedded = model2.encode([f"{prompt} {texts}"])
    embedded_tensor = torch.tensor(embedded)
    normal  = F.normalize(embedded_tensor, p=2, dim=1)
    print(normal)
    return jsonify({
        "embedding": normal[0].tolist()
    })
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
