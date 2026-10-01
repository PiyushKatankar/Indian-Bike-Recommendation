# 🏍️ Gear Glide | Indian Bikes Recommender Portal

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Gear Glide** is a full-stack Indian bike recommendation portal. Users can search for any Indian motorcycle or scooter, select specific comparison criteria (Price, Engine Displacement, Power, Mileage, Weight, Seat Height, and Brand Preference), and instantly receive recommendations for the top 5 matching twowheelers with interactive match percentage rings and side-by-side spec comparison modals.

---

## ✨ Key Features

- **🔍 Instant Fuzzy Autocomplete:** Fast client-side search indexing across 170+ Indian motorcycle and scooter models.
- **🎛️ Dynamic Similarity Tuning:** Choose exactly which dimensions to compare:
  - 💰 **Price Range:** Matches budget footprint
  - ⚡ **Engine Size (CC):** Displacement matching
  - 🐎 **Performance:** Max Power & Torque
  - ⛽ **Fuel Efficiency:** Mileage profile (KM/L)
  - ⚖️ **Kerb Weight:** Handling profile
  - 📐 **Seat Height:** Ergonomics & rider height fit
  - 🏷️ **Same Brand Bias:** Option to prioritize recommendations from the same manufacturer (+15% boost)
- **🎨 Reactive Vector Silhouettes:** Dynamically renders category-specific glowing vector SVG paths (Sports, Cruiser, Scooter, Commuter) with interactive riding-motion animations on hover.
- **📊 Match Percentage Gauges:** Radial SVG progress rings calculated in real-time.
- **⚔️ Side-by-Side Spec Comparison:** Interactive modal overlay calculating spec-by-spec differences (highlighting better/worse metrics in color-coded badges).

---

## 📐 Mathematical Similarity Engine

To compare metrics of different magnitudes (e.g. Price in ₹ vs Mileage in km/l), the algorithm applies **Min-Max Feature Scaling** and **Weighted Distance Math**:

1. **Normalization:**
   $$X_{\text{norm}} = \frac{X - \text{Min}(X)}{\text{Max}(X) - \text{Min}(X)}$$

2. **Distance Score:**
   $$D = \frac{\sum_{i \in \text{Active}} \left| T_{\text{norm}, i} - C_{\text{norm}, i} \right|}{\text{Count}(\text{Active})}$$

3. **Similarity Score (%):**
   $$\text{Similarity \%} = (1.0 - D) \times 100\%$$

---

## 🛠️ Project Structure

```
Gear Glide/
├── server.py             # Flask backend API & static routing
├── convert.py            # Data preprocessing script (CSV -> JSON)
├── bikes.json            # Processed database of 173 Indian motorcycles
├── bikesCleaned.csv      # Raw CSV dataset
├── static/
│   ├── index.html        # Single-page UI shell
│   ├── styles.css        # Obsidian dark theme, glassmorphism, animations
│   └── app.js            # Autocomplete, API fetcher, SVG gauges & compare modal
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation
```

---

## 🚀 Quick Start & Installation

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/gear-glide.git
cd gear-glide
```

### 2. Install dependencies
```bash
pip install flask
```

### 3. Start the Flask server
```bash
python server.py
```

### 4. Open in Browser
Visit **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your browser!

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
