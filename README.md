# Lor Browser 🪐

<div align="center">

<br>

<img src="docs/assets/logo.png" width="96" height="96" alt="Lor Logo" />

# Lor
### Modern Liquid Glass & Monochrome Browser for macOS

A minimalist desktop browser built with Electron, TypeScript, and React combining spaces & vertical tabs with a pure monochrome aesthetic.

<br>

[![macOS DMG](https://img.shields.io/badge/macOS%20DMG-Lor--0.1.0--arm64.dmg%20(196MB)-ffffff?style=for-the-badge&logo=apple&logoColor=black)](https://github.com/tylertzm/lor-browser/releases/download/v0.1.0/Lor-0.1.0-arm64.dmg)
[![Windows Setup](https://img.shields.io/badge/Windows%20Setup-Lor--Setup--0.1.0.exe%20(81MB)-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/tylertzm/lor-browser/releases/download/v0.1.0/Lor-Setup-0.1.0.exe)
[![GitHub Release](https://img.shields.io/badge/Release-v0.1.0--Beta-181717?style=for-the-badge&logo=github)](https://github.com/tylertzm/lor-browser/releases/tag/v0.1.0)
[![Website](https://img.shields.io/badge/Website-Live%20on%20GitHub%20Pages-brightgreen?style=for-the-badge)](https://tylertzm.github.io/lor-browser/)

<br>

[**Website**](https://tylertzm.github.io/lor-browser/) • [**Download macOS (.dmg)**](https://github.com/tylertzm/lor-browser/releases/download/v0.1.0/Lor-0.1.0-arm64.dmg) • [**Download Windows (.exe)**](https://github.com/tylertzm/lor-browser/releases/download/v0.1.0/Lor-Setup-0.1.0.exe) • [**GitHub Releases**](https://github.com/tylertzm/lor-browser/releases) • [**Report Bug**](https://github.com/tylertzm/lor-browser/issues)

<br>

![Lor Desktop Interface](docs/assets/lor-main-ui.png)

</div>

---

## 🌟 Key Highlights

<div align="center">

| Prologue | Spaces & Navigation |
| :---: | :---: |
| ![Lor Prologue](docs/assets/lor-onboarding.png) | ![Lor Spaces](docs/assets/spaces-preview.png) |

</div>

1. **Pure Liquid Monochrome Canvas**:
   - Deep obsidian canvas (`#000000`), carbon panels (`#0a0a0c`), crisp white typography (`#ffffff`), and silver accents.
   - High-contrast, zero-clutter visual hierarchy engineered for deep focus.

2. **Collapsible Sidebar with 15% Screen Peek**:
   - Press **`Cmd + S`** or click **`[|]`** to collapse the sidebar into borderless web immersion.
   - **Hover to Peek**: Move your cursor within the **left 15% edge of your display** to slide the navigation bar open instantly.
   - Click the lock toggle button while peeking to pin it permanently open.

3. **Dynamic Isolated Spaces**:
   - Organize workflows into distinct workspaces (`Personal`, `Work`, `Labs`).
   - Switch between them with smooth trackpad gestures (two-finger horizontal swipe).
   - Real-time space management and local persistence.

4. **Semantic Tab Tidy**:
   - Clean up tab chaos with one click. Intelligently clusters open tabs into categorized buckets:
     - `DEV & TECH` (GitHub, StackOverflow, Docs, Claude)
     - `RESEARCH & DOCS` (ArXiv, Wikipedia, OWASP)
     - `COMMUNICATIONS` (Proton, Slack, LinkedIn, Discord)
     - `MEDIA & VIDEO` (YouTube, Twitch, Streaming)
     - `GENERAL`
   - Automatically deduplicates redundant tabs.

5. **Pinned Tab Anchors**:
   - Hover over any tab and click the **`📌`** pin icon to anchor it to the top of your space.
   - Quick **`+ Pin Current`** button to anchor your active working tab immediately.

6. **Live Inline Omnibar**:
   - Press **`Cmd + L`** to enter addresses or queries directly in place.
   - One-click clean URL copying with instant visual confirmation.

---

## 📥 Download & Installation

### Option 1: macOS (Apple Silicon M1/M2/M3/M4)
👉 **[Download Lor-0.1.0-arm64.dmg (196 MB)](https://github.com/tylertzm/lor-browser/releases/download/v0.1.0/Lor-0.1.0-arm64.dmg)**

1. Open `Lor-0.1.0-arm64.dmg`.
2. Drag `Lor.app` into **Applications**.
3. **If Gatekeeper shows an alert on first launch:**
   Because this is an independent open-source release without an Apple Developer ID, run this in Terminal once:
   ```bash
   xattr -cr /Applications/Lor.app
   ```
   *(Or go to System Settings → Privacy & Security → Click "Open Anyway".)*

---

### Option 2: Windows (64-bit Windows 10/11)
👉 **[Download Lor-Setup-0.1.0.exe (81 MB)](https://github.com/tylertzm/lor-browser/releases/download/v0.1.0/Lor-Setup-0.1.0.exe)**

1. Double-click `Lor-Setup-0.1.0.exe`.
2. Follow the installer instructions (creates desktop and Start Menu shortcuts).
3. If Windows SmartScreen prompts on first launch, click **"More info"** → **"Run anyway"**.

---

## ⌨️ Shortcuts & Gestures

| Shortcut / Gesture | Action |
| :--- | :--- |
| **Move cursor to left 15% edge** | **Peek / Reveal Collapsed Sidebar** |
| **Two-finger horizontal swipe** | **Swipe between Spaces** |
| `Cmd + S` | Toggle / Lock Sidebar |
| `Cmd + T` | New Tab |
| `Cmd + L` | Focus Live Address Bar / Omnibar |
| `Cmd + W` | Close Active Tab |
| `Cmd + [` / `Cmd + ]` | Navigate Back / Forward |
| `Cmd + R` | Reload Current Page |

---

## 🛠️ Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) (v9+)
- macOS (Apple Silicon or Intel)

### Commands

```bash
# Clone the repository
git clone https://github.com/tylertzm/lor-browser.git
cd lor-browser

# Install dependencies
npm install

# Start development mode
npm run dev

# Package native macOS .dmg bundle
npm run package
```

The compiled installer will be generated in `dist/Lor-0.1.0-arm64.dmg`.

---

## 🧑‍💻 Creator Spotlight

Conceived, designed, and engineered with obsession by **Tyler Tan**.

- **GitHub**: [@tylertzm](https://github.com/tylertzm)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
