<div align="center">

<img src="https://img.shields.io/badge/GATE-Exam%20Simulator-6c63ff?style=for-the-badge&logo=graduation-cap&logoColor=white" />
<img src="https://img.shields.io/badge/CS%20%26%20DA-25%20Year%20PYQ-00d4aa?style=for-the-badge" />
<img src="https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-222?style=for-the-badge&logo=github&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />

# Swastiksha — GATE Exam Simulator

### *Ultimate Premium Preparation Portal for GATE CS & DA*

**[Live Demo](https://ShrutiS30.github.io/Swastiksha/)** &nbsp;|&nbsp; **[ Repository](https://github.com/ShrutiS30/Swastiksha)**

</div>

---

## What is Swastiksha?

**Swastiksha** is a fully authentic, browser-based GATE examination simulator built for serious aspirants. It replicates the exact TCS iON exam environment used in GATE — complete with a virtual scientific calculator, timed sessions, section-wise navigation, question palettes, negative marking, and deep performance analytics.

>  **1,700+ questions** across **25 years** of GATE CS & DA Previous Year Papers — all in one place, completely free.

---

## Features

| Feature | Description |
|---|---|
|  **Authentic GATE Interface** | Pixel-perfect replication of the official TCS iON exam UI |
|  **25-Year PYQ Library** | GATE CS (2000–2025) & DA (2024–2025) question bank |
|  **Scientific Calculator** | Built-in virtual calculator matching GATE specifications |
|  **Timed Mock Tests** | 180-min full-length or 60-min subject-wise practice modes |
|  **Performance Analytics** | Section-wise score breakdown, accuracy charts with Chart.js |
|  **3 Premium Themes** | Dark Slate, Pitch Black, and Light Mode |
|  **KaTeX Math Rendering** | LaTeX equations rendered beautifully in real-time |
|  **Fully Responsive** | Works perfectly on desktop, tablet, and mobile |
|  **Question Palette** | Mark for review, attempted, skipped — full navigation control |
|  **MSQ / NAT / MCQ** | All GATE question types supported with correct scoring rules |
|  **Answer Key** | Official answer keys applied for all available years |

---

##  Project Structure

```
Swastiksha/
├── index.html          # Main application shell (splash, login, exam, results)
├── style.css           # Complete premium design system (3,600+ lines)
├── app.js              # Exam engine, calculator, analytics logic (2,500+ lines)
├── questions.js        # Full PYQ database — CS + DA streams (1,700+ questions)
├── images/             # Diagram & figure assets for visual questions
│   ├── q3.png, q4.png, ...
│   └── 2024_da_*.png
└── backend/            # Optional Node.js AI Tutor proxy (Express)
    ├── server.js
    ├── package.json
    └── .env.example
```

---

##  Running Locally

### Option A — Open directly (no install needed)
Just double-click `index.html` — the simulator runs entirely in your browser with zero dependencies.

### Option B — Serve with a local server (recommended for best performance)
```bash
# Using Node.js
npx serve .

# Using Python
python -m http.server 8080
```
Then open `http://localhost:8080`.

---

##  Backend (Optional AI Tutor)

The `backend/` folder contains an Express.js proxy for a Gemini AI tutor feature.

```bash
cd backend
cp .env.example .env          # Fill in your GEMINI_API_KEY
npm install
npm start                     # Runs on http://localhost:5000
```

>  The main exam simulator works **100% without the backend**. The backend only powers the optional AI explanation feature.

---

##  Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | Vanilla HTML5 + CSS3 + JavaScript (ES6+) |
| Math Rendering | [KaTeX](https://katex.org/) v0.16 |
| Charts | [Chart.js](https://www.chartjs.org/) |
| Calculator | [Math.js](https://mathjs.org/) |
| Icons | [Font Awesome](https://fontawesome.com/) 6.4 |
| Fonts | [Google Fonts](https://fonts.google.com/) — Outfit, Fira Code, JetBrains Mono |
| Backend | Node.js + Express.js (optional) |
| Hosting | GitHub Pages |

---

##  GATE Streams Covered

###  Computer Science & IT (CS)
`2000 · 2001 · 2002 · 2003 · 2004 · 2005 · 2006 · 2007 · 2008 · 2009 · 2010 · 2011 · 2012 · 2013 · 2014 · 2015 · 2016 · 2017 · 2018 · 2019 · 2020 · 2021 · 2022 · 2023 · 2024 · 2025`

###  Data Science & AI (DA)
`2024 · 2025`

---

##  How to Use

1. **Open the portal** → You're greeted with a cinematic splash screen
2. **Enter your name** → Personalised welcome & session tracking
3. **Select your stream** → Computer Science (CS) or Data Science & AI (DA)
4. **Choose exam mode** → Full 180-min paper or 60-min subject-wise drill
5. **Pick a year** → Select from the full PYQ archive
6. **Start the exam** → Real GATE interface with countdown timer
7. **Submit & review** → Detailed section-wise performance breakdown

---

##  Screenshots

> *Open the live demo to experience the full cinematic interface!*

🔗 **[https://ShrutiS30.github.io/Swastiksha/](https://ShrutiS30.github.io/Swastiksha/)**

---

##  Contributing

Pull requests are welcome! If you find a question with an incorrect answer or want to add more years:

1. Fork the repository
2. Create a new branch (`git checkout -b fix/question-typo`)
3. Make your changes
4. Open a Pull Request

---

##  License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

---

<div align="center">

Made with ❤️ for every GATE aspirant

**⭐ Star this repo if it helped you!**

</div>
