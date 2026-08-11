import os
import chromadb
from chromadb.utils import embedding_functions

# Configuration
DB_PATH = "agent_knowledge_db"
COLLECTION_NAME = "project_code"

class KnowledgeBase:
    def __init__(self):
        print(f"[Memory] Initializing Vector Database at {DB_PATH}...")
        self.client = chromadb.PersistentClient(path=DB_PATH)
        
        # Use default sentence-transformers model
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=self.embedding_fn
        )
        print("[Memory] Database Ready.")

    def index_project(self, root_path):
        """Scans and indexes code files in the project."""
        print(f"[Memory] Indexing project: {root_path}")
        
        documents = []
        metadatas = []
        ids = []
        
        allowed_exts = {'.py', '.js', '.html', '.css', '.md', '.json'}
        ignore_dirs = {'.git', 'node_modules', '__pycache__', 'agent_knowledge_db', 'venv'}

        count = 0
        for dirpath, dirnames, filenames in os.walk(root_path):
            # Filter ignore dirs
            dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
            
            for file in filenames:
                if os.path.splitext(file)[1] in allowed_exts:
                    full_path = os.path.join(dirpath, file)
                    rel_path = os.path.relpath(full_path, root_path)
                    
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            
                        # Chunking logic (simple for now)
                        # Split by functions or just max chars could be better, 
                        # but lets stick to file-level or large chunks for simplicity
                        if content.strip():
                            documents.append(content)
                            metadatas.append({"path": rel_path, "filename": file})
                            ids.append(rel_path)
                            count += 1
                            
                    except Exception as e:
                        print(f"Skipped {file}: {e}")

        if documents:
            # Batch upsert to avoid issues
            batch_size = 100
            for i in range(0, len(documents), batch_size):
                end = min(i + batch_size, len(documents))
                print(f"[Memory] Upserting batch {i} to {end}...")
                self.collection.upsert(
                    documents=documents[i:end],
                    metadatas=metadatas[i:end],
                    ids=ids[i:end]
                )
        
        return f"Indexed {count} files."

    def query(self, query_text, n_results=5):
        """Searches the knowledge base."""
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        
        # Format results
        output = ""
        if results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][i]
                path = meta.get('path', 'unknown')
                output += f"\n--- Source: {path} ---\n{doc[:500]}...\n" # Show preview
        
        return output if output else "No relevant code found."

if __name__ == "__main__":
    # Test
    kb = KnowledgeBase()
    # kb.index_project(".")
    # print(kb.query("How does the p2p network work?"))
