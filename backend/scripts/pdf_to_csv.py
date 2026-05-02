from pypdf import PdfReader
import pandas as pd
import re
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "Data"
PDF_PATH = DATA_PATH / "Constitution.pdf"
CSV_PATH = DATA_PATH / "clean_constitution.csv"

# ---------- LOAD PDF ----------
reader = PdfReader(str(PDF_PATH))

full_text = ""

for page in reader.pages:
    text = page.extract_text()
    if text:
        full_text += "\n" + text

# ---------- CLEAN TEXT ----------
def clean_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'Contents.*?ARTICLES', '', text, flags=re.IGNORECASE)
    text = re.sub(r'CHAPTER\s+[IVX]+.*?', '', text)
    text = re.sub(r'PART\s+[IVX]+', '', text)
    return text.strip()

full_text = clean_text(full_text)

# ---------- EXTRACT ARTICLES ----------
def extract_articles(text: str):
    pattern = r'Article\s+(\d+)[\.\-\s]*(.*?)(?=Article\s+\d+|$)'
    matches = re.findall(pattern, text, re.DOTALL)

    articles = []
    for num, content in matches:
        content = content.strip()
        if content:
            articles.append((num.strip(), content))
    return articles

articles = extract_articles(full_text)

# ---------- CLASSIFICATION ----------
def classify_article(num: str):
    num = int(num)

    if 12 <= num <= 35:
        return "Fundamental Right", "Part III"
    elif 36 <= num <= 51:
        return "Directive Principle", "Part IV"
    elif 51 <= num <= 51:
        return "Fundamental Duty", "Part IVA"
    else:
        return "General Law", "Other"

# ---------- TITLE EXTRACTION ----------
def extract_title(content: str):
    parts = content.split(".")
    return parts[0].strip() if parts else ""

# ---------- KEYWORD GENERATION ----------
def generate_keywords(text: str):
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    unique_words = list(dict.fromkeys(words))[:10]
    return ", ".join(unique_words)

# ---------- BUILD DATA ----------
data = []

for num, raw_content in articles:
    content = clean_text(raw_content)

    if not content:
        continue

    type_, part = classify_article(num)
    title = extract_title(content)
    keywords = generate_keywords(content)

    data.append({
        "content": content,
        "act": "Constitution",
        "section": f"Article {num}",
        "part": part,
        "type": type_,
        "title": title,
        "keywords": keywords
    })

# ---------- CREATE DATAFRAME ----------
df = pd.DataFrame(data)

# Remove duplicates
df = df.drop_duplicates(subset=["section"])

# Sort properly
df["section_num"] = df["section"].str.extract(r'(\d+)').astype(int)
df = df.sort_values(by="section_num").drop(columns=["section_num"])

# ---------- SAVE CSV ----------
df.to_csv(CSV_PATH, index=False, encoding="utf-8")

print(f"✅ Clean CSV created at: {CSV_PATH}")
print(f"📊 Total Articles Extracted: {len(df)}")