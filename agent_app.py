import customtkinter as ctk
import threading
import tkinter.filedialog as filedialog
import os
from agent_core import NemotronAgent

# App Configuration
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class NemotronApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Setup
        self.title("Nemotron Agent Ultimate")
        self.geometry("1000x800")
        
        # Grid Layout
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Sidebar
        self.sidebar_frame = ctk.CTkFrame(self, width=160, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, rowspan=4, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(5, weight=1)
        
        self.logo_label = ctk.CTkLabel(self.sidebar_frame, text="Minimax\nAgent", font=ctk.CTkFont(size=20, weight="bold"))
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))
        
        self.status_label = ctk.CTkLabel(self.sidebar_frame, text="Ready", text_color="green")
        self.status_label.grid(row=1, column=0, padx=20, pady=10)

        # Model Switcher
        self.model_label = ctk.CTkLabel(self.sidebar_frame, text="Model:", anchor="w")
        self.model_label.grid(row=2, column=0, padx=20, pady=(10, 0))
        self.model_menu = ctk.CTkOptionMenu(self.sidebar_frame, values=["Loading..."], command=self.change_model)
        self.model_menu.grid(row=3, column=0, padx=20, pady=(0, 10))

        # Chat Area
        self.chat_frame = ctk.CTkScrollableFrame(self, corner_radius=10)
        self.chat_frame.grid(row=0, column=1, rowspan=3, padx=(20, 20), pady=(20, 0), sticky="nsew")
        
        # Input Area
        self.input_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.input_frame.grid(row=3, column=1, padx=20, pady=20, sticky="ew")
        self.input_frame.grid_columnconfigure(1, weight=1)

        self.attach_btn = ctk.CTkButton(self.input_frame, text="+", width=40, font=("Arial", 20), command=self.attach_file)
        self.attach_btn.grid(row=0, column=0, padx=(0, 10), sticky="w")

        self.input_entry = ctk.CTkEntry(self.input_frame, placeholder_text="Type your request here...", height=50, corner_radius=10)
        self.input_entry.grid(row=0, column=1, sticky="ew")
        self.input_entry.bind("<Return>", self.send_message_event)
        
        # Persona Switcher
        self.persona_label = ctk.CTkLabel(self.sidebar_frame, text="Persona:", anchor="w")
        self.persona_label.grid(row=4, column=0, padx=20, pady=(10, 0))
        self.persona_menu = ctk.CTkOptionMenu(self.sidebar_frame, values=["Default", "Coder", "Hacker", "Researcher", "Writer"], command=self.change_persona)
        self.persona_menu.grid(row=5, column=0, padx=20, pady=(0, 10))

        # Goal Mode Controls
        self.goal_checkbox = ctk.CTkCheckBox(self.sidebar_frame, text="Goal Mode (Auto)", font=("Arial", 12))
        self.goal_checkbox.grid(row=6, column=0, padx=20, pady=(10, 10))
        
        self.stop_button = ctk.CTkButton(self.sidebar_frame, text="STOP", fg_color="red", command=self.stop_agent)
        self.stop_button.grid(row=7, column=0, padx=20, pady=(0, 20))

        self.send_button = ctk.CTkButton(self.input_frame, text="Send", width=100, command=self.send_message_event)
        self.send_button.grid(row=0, column=2, padx=(10, 0), sticky="e")

        # Internal State
        self.agent = None
        self.attached_image = None
        self.running_thread = None
        
        # Start agent init
        threading.Thread(target=self.init_agent).start()
        self.protocol("WM_DELETE_WINDOW", self.on_close)

    def init_agent(self):
        self.status_label.configure(text="Loading Memory...", text_color="orange")
        self.agent = NemotronAgent()
        
        # Populate models
        models = self.agent.list_models()
        self.model_menu.configure(values=models)
        self.model_menu.set(self.agent.model)
        
        self.status_label.configure(text="Online", text_color="#00FF00")
        self.add_message("System", "Nemotron Ultimate Online. RAG & Tools Ready.")

    def change_model(self, new_model):
        if self.agent:
            self.agent.model = new_model
            self.add_message("System", f"Switched to {new_model}")

    def change_persona(self, new_persona):
        if self.agent:
            msg = self.agent.set_persona(new_persona)
            self.add_message("System", msg)

    def attach_file(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg;*.jpeg;*.bmp")])
        if path:
            self.attached_image = path
            self.attach_btn.configure(fg_color="green")
            
    def stop_agent(self):
        if self.agent:
            self.agent.stop()
            self.status_label.configure(text="Stopping...", text_color="red")
            self.add_message("System", "[Interrupt Signal Sent]")

    def send_message_event(self, event=None):
        message = self.input_entry.get()
        if not message and not self.attached_image: return
            
        self.input_entry.delete(0, "end")
        
        # Display User Message
        display_text = message
        if self.attached_image:
            display_text += f"\n[Attached: {os.path.basename(self.attached_image)}]"
        if self.goal_checkbox.get():
             display_text += " [GOAL MODE ON]"
        
        self.add_message("You", display_text)
        
        # Run chat
        self.running_thread = threading.Thread(target=self.process_chat, args=(message, self.attached_image))
        self.running_thread.start()
        
        # Reset attachment
        self.attached_image = None
        self.attach_btn.configure(fg_color=["#3B8ED0", "#1F6AA5"]) # Default blue

    def process_chat(self, message, image_path):
        self.status_label.configure(text="Thinking...", text_color="yellow")
        goal_mode = bool(self.goal_checkbox.get())
        
        # Create a container frame for the streaming message
        msg_frame = ctk.CTkFrame(self.chat_frame, fg_color="transparent")
        msg_frame.pack(fill="x", pady=5)
        
        # Streaming Bubble (Temporary)
        stream_bubble = ctk.CTkTextbox(
            msg_frame, fg_color="#2b2b2b", text_color="#DCE4EE", 
            corner_radius=10, width=600, height=40, font=("Arial", 14), wrap="word"
        )
        stream_bubble.pack(anchor="w", padx=10)
        stream_bubble.insert("0.0", "Nemotron: ")
        
        full_response = ""
        try:
            for chunk in self.agent.chat(message, image_path, goal_mode=goal_mode):
                full_response += chunk
                
                # Update Stream Bubble
                stream_bubble.configure(state="normal")
                stream_bubble.delete("0.0", "end")
                stream_bubble.insert("0.0", f"Nemotron: {full_response}")
                
                # Auto-resize
                lines = full_response.count('\n') + (len(full_response) // 60) + 1
                stream_bubble.configure(height=max(40, lines * 22 + 10), state="disabled")
                
            # Done Streaming: Replace with Formatted Markdown
            stream_bubble.destroy()
            self.render_markdown(msg_frame, "Nemotron", full_response)
            
        except Exception as e:
            stream_bubble.configure(state="normal")
            stream_bubble.insert("end", f"\nError: {e}")
            stream_bubble.configure(state="disabled")
            
        self.status_label.configure(text="Online", text_color="#00FF00")

    def add_message(self, sender, text):
        frame = ctk.CTkFrame(self.chat_frame, fg_color="transparent")
        frame.pack(fill="x", pady=5)
        self.render_markdown(frame, sender, text)

    def render_markdown(self, parent_frame, sender, text):
        color = "#1f6aa5" if sender == "You" else "#2b2b2b"
        align = "e" if sender == "You" else "w"
        
        # Header for the message (Sender Name)
        # header = ctk.CTkLabel(parent_frame, text=sender, font=("Arial", 10, "bold"), text_color="gray")
        # header.pack(anchor=align, padx=15)
        
        # Split by code blocks
        parts = text.split("```")
        
        for i, part in enumerate(parts):
            if not part.strip(): continue
            
            is_code = (i % 2 != 0)
            
            # Styling
            bg_color = "#1a1a1a" if is_code else color
            font = ("Courier New", 13) if is_code else ("Arial", 14)
            text_color = "#00ff00" if is_code else "#DCE4EE"
            
            # Clean up code block language identifier (e.g. ```python)
            if is_code:
                if "\n" in part:
                    # Remove first line if it's just the lang name
                    first_line = part.split("\n", 1)[0].strip()
                    if " " not in first_line and len(first_line) < 15: 
                         part = part.split("\n", 1)[1]
            
            content = f"{part}" if is_code else f"{sender}: {part}" if i==0 else part
            
            lines = content.count('\n') + (len(content) // (70 if is_code else 60)) + 1
            height = max(30, lines * 20 + 10)

            bubble = ctk.CTkTextbox(
                parent_frame,
                fg_color=bg_color,
                text_color=text_color,
                corner_radius=10 if not is_code else 5,
                width=650 if is_code else 600,
                height=height,
                font=font,
                wrap="none" if is_code else "word"
            )
            bubble.insert("0.0", content)
            bubble.configure(state="disabled")
            bubble.pack(anchor=align, padx=10, pady=2 if is_code else 0)

    def on_close(self):
        self.destroy()

if __name__ == "__main__":
    app = NemotronApp()
    app.mainloop()
