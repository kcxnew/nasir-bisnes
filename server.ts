import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data.json");

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  note?: string;
  createdAt: number;
}

const generateInitialData = (): Transaction[] => {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return [
    { id: '1', type: 'income', amount: 5000, category: 'Salary', date: today.toISOString().split('T')[0], note: 'Monthly Salary', createdAt: Date.now() },
    { id: '2', type: 'expense', amount: 150, category: 'Food & Dining', date: today.toISOString().split('T')[0], note: 'Groceries', createdAt: Date.now() - 1000 },
    { id: '3', type: 'expense', amount: 50, category: 'Transportation', date: lastWeek.toISOString().split('T')[0], note: 'Gas', createdAt: Date.now() - 20000 },
    { id: '4', type: 'income', amount: 800, category: 'Freelance', date: lastWeek.toISOString().split('T')[0], note: 'Web Design Project', createdAt: Date.now() - 50000 },
  ];
};

async function readData(): Promise<Transaction[]> {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      const data = generateInitialData();
      await writeData(data);
      return data;
    }
    return [];
  }
}

async function writeData(data: Transaction[]) {
  try {
     await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch(e) {
     console.error("Write Error:", e);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Wait for clients
  const clients = new Set<express.Response>();
  
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    clients.add(res);
    
    req.on('close', () => {
      clients.delete(res);
    });
  });

  const broadcastUpdate = async () => {
    const data = await readData();
    const dataStr = JSON.stringify({ type: 'update', data });
    clients.forEach(client => {
      client.write(`data: ${dataStr}\n\n`);
    });
  };

  app.get("/api/transactions", async (req, res) => {
    const data = await readData();
    res.json(data);
  });

  app.post("/api/transactions", async (req, res) => {
    const newTransaction = req.body;
    if (!newTransaction.id) {
       newTransaction.id = crypto.randomUUID();
    }
    if (!newTransaction.createdAt) {
       newTransaction.createdAt = Date.now();
    }
    
    const data = await readData();
    data.unshift(newTransaction);
    await writeData(data);
    res.json(newTransaction);
    broadcastUpdate();
  });

  app.put("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const updatedTransaction = req.body;
    const data = await readData();
    const index = data.findIndex(t => t.id === id);
    if (index !== -1) {
       data[index] = { ...data[index], ...updatedTransaction };
       await writeData(data);
       res.json(data[index]);
       broadcastUpdate();
    } else {
       res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;
    let data = await readData();
    data = data.filter(t => t.id !== id);
    await writeData(data);
    res.json({ success: true });
    broadcastUpdate();
  });

  // ======= WEBHOOK FOR HERMES / TELEGRAM AGENT =======
  // The agent sends a POST request. It can either send structured data or natural language text.
  app.post("/api/agent/webhook", async (req, res) => {
    console.log("Webhook triggered from Agent:", req.body);
    try {
        const payload = req.body;
        let transactions: any[] = [];

        if (payload.text && typeof payload.text === 'string') {
            // Use Gemini to parse the natural language into structured data
            if (!process.env.GEMINI_API_KEY) {
                res.status(500).json({ error: "GEMINI_API_KEY not configured. Cannot parse text." });
                return;
            }
            const { GoogleGenAI, Type } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const prompt = `Parse the following natural language into an array of financial transactions for a dashboard.
Current Date: ${new Date().toISOString().split('T')[0]}

Categories for Income: Salary, Freelance, Investments, Gift, Bisnes, Other
Categories for Expense: Food & Dining, Transportation, Housing, Utilities, Entertainment, Shopping, Health, Education, Bisnes, Hutang, Other

Text: "${payload.text}"`;

            const aiResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Must be 'income' or 'expense'" },
                      amount: { type: Type.NUMBER, description: "The amount in MYR (number only)" },
                      category: { type: Type.STRING, description: "The most appropriate category from the allowed lists" },
                      date: { type: Type.STRING, description: "Date of the transaction in YYYY-MM-DD format" },
                      note: { type: Type.STRING, description: "A short note or description" }
                    },
                    required: ["type", "amount", "category", "date"]
                  }
                }
              }
            });

            const parsedText = aiResponse.text?.trim() || "[]";
            try {
                transactions = JSON.parse(parsedText);
            } catch (e) {
                console.error("Failed to parse Gemini output:", parsedText);
                res.status(500).json({ error: "Failed to parse transactions from text." });
                return;
            }
        } else {
            // Already structured
            transactions = Array.isArray(payload) ? payload : (payload.transactions || []);
        }
        
        if (!transactions || transactions.length === 0) {
            res.status(400).json({ error: "No transactions found in the payload." });
            return;
        }

        const data = await readData();
        const added = [];

        for (const t of transactions) {
            // Simple validation and sanitization
            const newT: Transaction = {
                id: crypto.randomUUID(),
                type: t.type === 'income' ? 'income' : 'expense',
                amount: Number(t.amount) || 0,
                category: t.category || (t.type === 'income' ? 'Other' : 'Other'),
                date: t.date || new Date().toISOString().split('T')[0],
                note: t.note || `Added via Agent`,
                createdAt: Date.now()
            };
            data.unshift(newT);
            added.push(newT);
        }

        await writeData(data);
        broadcastUpdate();
        res.json({ success: true, message: `Successfully added ${added.length} transactions.`, added });
    } catch (error: any) {
        console.error("Webhook error:", error);
        res.status(500).json({ error: "Failed to process webhook" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For React Router fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
