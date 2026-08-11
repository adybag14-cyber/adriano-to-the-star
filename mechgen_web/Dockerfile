FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libgcc-s1 \
    libgomp1 \
    libstdc++6 \
    libglib2.0-0 \
    libx11-6 \
    libxcb1 \
    libxrender1 \
    libxext6 \
    libsm6 \
    libfreetype6 \
    libfontconfig1 \
    libcairo2 \
    libpangocairo-1.0-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/mechgen_web

COPY mechgen_web/requirements.txt /workspace/mechgen_web/requirements.txt
COPY mechgen /workspace/mechgen
COPY fonts /workspace/fonts

RUN python -m pip install --upgrade pip \
  && python -m pip install --no-cache-dir -r requirements.txt \
  && python -m pip install --no-cache-dir "rdkit>=2025.9.0" \
  && python -c "from rdkit import Chem; from rdkit.Chem import Draw; img = Draw.MolToImage(Chem.MolFromSmiles('C')); print(img.size)"

COPY mechgen_web /workspace/mechgen_web

RUN useradd -m -u 10001 appuser \
  && chown -R appuser:appuser /workspace

USER appuser

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
