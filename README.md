# Lab 8191

An archive of small, interactive UI components that feature 🧀 cursor effects, 🎇 physics simulations, 🗂️ typography, and 🪎 a few odds and ends. 

Each one is a self-contained demo with a live preview, a short write-up, and its component code. 

Live at [lab8191.vercel.app](https://lab8191.vercel.app).

### 1. Project structure

```text
src/
├── app/
│   ├── [category]/
│   │   ├── page.tsx           # redirects to the category's first experiment
│   │   └── [slug]/
│   │       └── page.tsx       # renders one experiment: demo + MDX write-up
│   ├── not-found.tsx
│   └── page.tsx
├── experiments/
│   └── <category>/
│       ├── index.ts           # registers each experiment (slug, title, component, contentPath)
│       └── <experiment>/
│           ├── Component.tsx  # the demo itself
│           └── content.mdx    # write-up, rendered via <CodeFrom>
└── components/
    ├── CodeBlock/             # syntax-highlighted code display
    │   └── CodeFrom.tsx       # pulls source (or a named region) straight from Component.tsx into the MDX
    └── CategoryLayout/        # sidebar nav + demo + MDX shell shared by every experiment page
```

Each experiment's `content.mdx` uses `<CodeFrom file="..." />` to render source pulled live from its own `Component.tsx`, so the docs can never drift out of sync with the actual code.

### 2. Adding a new experiment

Want to add one? Here's how:

1. Create `src/experiments/<category>/<experiment-name>/Component.tsx` and `content.mdx`
2. Register it in `src/experiments/<category>/index.ts`, wrapping the component in `next/dynamic()`.
3. If it's a component with a handful of tunable values, kindly expose them as props with sensible defaults rather than a fixed internal config. That way, the usage section in the MDX becomes more meaningful.

### 3. Development

Get the project running locally on your machine:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Once running, open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Inspiration, acknowledgement & license
 
Some of these components may have been inspired by awesome effects and ideas already out there. While the code here is my own take, I would like to make sure credit goes where it's due! So, if you recognize any interactions you created, please open an issue and I'll gladly add you to the credits. 
 
Photos used in demos come from [Unsplash](https://unsplash.com), and fall under the [Unsplash License](https://unsplash.com/license).
 
This project is licensed under the MIT License.

Thank you!

🍔