# ADRIANO TO THE STAR - Interstellar Travel Agency (I.T.A)

![Banner](images/bg-large.jpg)

> **"To the stars, through utilizing the best of humanity's tools."**

**ADRIANO TO THE STAR** is a hybrid platform that seamlessly merges a **3D Space Strategy Game**, a **Real-Time Digital Economy**, and a suite of **Next-Gen Utilities**.  It is not just a website; it is an immersive ecosystem where users can explore the cosmos, manage assets, trade unique planetary claims, and utilize advanced AI tools—all within a single, cohesive interface.

---

## 🌌 The Three Pillars

The platform is built upon three core pillars that interact to create a unique user experience:

1.  **Exoplanet Pioneer (The Game)**: A deep, procedurally generated 3D strategy game where you colonize real exoplanets.
2.  **The Interstellar Economy**: A robust marketplace for trading planetary claims, investing in space missions, and managing a digital portfolio.
3.  **Stellar Utilities**: A suite of professional-grade tools including Dual-Core AI, E2E Encrypted Chat, and Cloud Storage.

---

## 🎮 Exoplanet Pioneer: The Game

**Exoplanet Pioneer** is the heart of the I.T.A experience—a browser-based 3D strategy game built with **Three.js**.

### Key Features
*   **Procedural Universe**: Explore over **4,000 unique exoplanets**, each generated from real NASA Kepler data. Every planet has unique terrain, resources, and habitability ratings.
*   **Base Building**: Construct and upgrade a variety of structures:
    *   **Solar Arrays**: Power your colony.
    *   **Habitat Domes**: House your colonists.
    *   **Mining Rigs**: Extract precious resources.
    *   **Tech Labs**: Unlock new technologies.
*   **Ultimate Merging**: Combine max-level buildings into massive "Ultimate" structures (e.g., *Ultimate Solar Array*) for massive buffs and unique 3D models.
*   **HAL 9000 Integration**: Your ship is governed by a fully voiced AI (powered by WebLLM) that provides guidance, lore, and strategic advice.
*   **Economy Integration**: Resources gathered in-game can be traded in the global marketplace.

### How to Play
1.  Navigate to **[Games > Exoplanet Pioneer](exoplanet-pioneer.html)**.
2.  Select a planet from the **Exoplanet Database**.
3.  Click "Launch Mission" to enter the 3D view.
4.  Manage your Energy, Population, and Credits to build a thriving colony.

---

## 💰 The Interstellar Facility: Digital Economy

The **Interstellar Economy** allows users to trade, invest, and manage assets within the I.T.A ecosystem.

### Features
*   **Real-Time Marketplace** (`marketplace.html`): Buy and sell planetary claims. Prices fluctuate based on player activity and demand. Powered by **Supabase Realtime**.
*   **Planetary Claims**: truly own a piece of the galaxy. All claims are verified with a unique **SHA-256 Cryptographic Certificate**.
*   **Rentals & Leasing**: Lease your claimed planets to other players for passive currency generation.
*   **Crowdfunding**: Invest virtual credits in large-scale space missions (simulating real-world companies like SpaceX and Blue Origin) to earn dividends.
*   **Investment Portfolios**: Track your net worth, asset performance, and market trends in a dedicated dashboard.

---

## 🛠️ Stellar Utilities: The Toolkit

Beyond gaming, I.T.A provides a suite of powerful utilities for daily use.

### 🤖 Stellar AI
A dual-core AI assistant available throughout the platform (`stellar-ai.html`).
*   **Cloud Core**: Powered by **Google Gemini Pro** for complex reasoning and vast knowledge.
*   **Edge Core**: Powered by **WebLLM** (Llama 3 locally) for private, offline-capable interactions.
*   **Multimodal**: Supports text, voice, and vision input/output.

### 🔐 Secure Chat
An industry-grade encrypted messaging platform (`secure-chat.html`).
*   **End-to-End Encryption**: All messages are encrypted on your device using **RSA-2048** and **AES-GCM** before reaching the server.
*   **Identity Management**: Generate and manage your own cryptographic key pairs.
*   **Privacy First**: No one—not even the admins—can read your encrypted chats.

### 🌐 Broadband Checker
A real-time utility for checking internet speeds and finding ISP deals (`broadband-checker.html`).
*   **Live Scraping**: Aggregates real deals from major UK providers.
*   **Speed Test**: Integrated low-latency speed testing tool.

### ☁️ File Storage
Your personal cloud locker (`file-storage.html`).
*   **Drag & Drop**: Seamlessly upload and manage files.
*   **Universal Access**: Access your files from any device via your I.T.A account.

### 📅 Event Calendar
A fully functional calendar system for scheduling personal events, game raids, or reminder (`event-calendar.html`).

---

## 🌍 The Exoplanet Database

The foundation of our diverse universe (`database.html`).
*   **NASA Integration**: Directly feeds data from the **NASA Exoplanet Archive API**.
*   **Deep Filtering**: Filter planets by:
    *   Distance from Earth
    *   Discovery Method
    *   Habitability Score
    *   Host Star Type
*   **Star Maps**: Visualize the local stellar neighborhood in interactive 3D.

---

## 👥 Social & Community

Connect with fellow explorers.
*   **Profiles**: Customize your user profile with badges and stats.
*   **Badges & Achievements**: Earn trophies for milestones (e.g., "First Contact", "Tycoon", "Explorer").
*   **Groups**: Join factions or interest groups (`groups.html`).
*   **Forum**: Discuss strategies, science, and platform updates (`forum.html`).
*   **Newsletter**: Stay updated with the latest cosmic news (`newsletter.html`).

---

## 🕹️ Entertainment Archive

A tribute to computer history (`games.html`).
*   **Flash Games Archive**: A curated library of over **1,200 classic Flash games**, playable directly in the browser via the **Ruffle** emulator.
*   **Cosmic Music Player**: A persistent audio player featuring mathematical and ambient soundscapes to accompany your journey.
*   **Total War 2**: Web-based integration of the classic strategy title (`total-war-2.html`).

---

## 🧪 Local Dev & Tests (Exoplanet Pioneer slice)

- Start a static server from repo root (example): `npx http-server -p 3000 .`
- Run Playwright smoke (ship designs): `BASE_URL=http://127.0.0.1:3000 npx playwright test tests/e2e/exoplanet-pioneer-ship-designs.spec.js`
- BASE_URL is configurable via env if you use a different port/host.
- Live feeds (NASA/APOD/Launch/News) will warn when offline; tests are resilient but you can mute by mocking fetch in Playwright if needed.

## 💻 Technical Architecture

The platform is a masterclass in modern web technologies, combining high performance with edge computing.

### Stack
*   **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+) for maximum performance and zero build-step latency.
*   **3D Engine**: **Three.js** (WebGL) for rendering planets and the galaxy.
*   **Backend / BaaS**: **Supabase** for Authentication, PostgreSQL Database, Realtime subscriptions, and File Storage.
*   **AI Engine**: Hybrid **Google Gemini API** (Serverless Function) + **WebLLM** (In-Browser WASM).
*   **Hosting**: GitLab Pages / Netlify (Static Delivery).

### Security
*   **CSRF Protection**: Double-submit cookie pattern for all state-changing requests.
*   **Rate Limiting**: Token bucket algorithm to prevent API abuse.
*   **Input Sanitization**: Strict validation on all user inputs to prevent XSS.

---

## 🚀 Installation & Setup

To run the project locally for development:

1.  **Prerequisites**:
    *   Node.js (v18+) - primarily for local dev server and simple tools.
    *   Python 3.9+ - for data scraping scripts.

2.  **Clone the Repository**:
    ```bash
    git clone https://gitlab.com/your-username/adrianostar-website.git
    cd adrianostar-website
    ```

3.  **Configuration**:
    *   Rename `supabase-config.example.js` to `supabase-config.js`.
    *   Add your Supabase URL and Anon Key.

4.  **Run Locally**:
    *   You can use any static file server. We recommend `http-server`:
    ```bash
    npx http-server .
    ```
    *   Open `http://localhost:8080` in your browser.

---

> **ADRIANO TO THE STAR**
> *Exploring the cosmos/One line of code at a time.*
