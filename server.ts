import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data.json");
const BUDGETS_FILE = path.join(process.cwd(), "budgets.json");
const SAVINGS_FILE = path.join(process.cwd(), "savings.json");
const RECURRING_FILE = path.join(process.cwd(), "recurring.json");

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  note?: string;
  createdAt: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color?: string;
}

interface RecurringTransaction {
  id: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  description: string;
  dayOfMonth: number;
  lastProcessedDate?: string;
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

async function readBudgets(): Promise<Record<string, number>> {
  try {
    const data = await fs.readFile(BUDGETS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error: any) {
    return {};
  }
}

async function writeBudgets(budgets: Record<string, number>) {
  try {
     await fs.writeFile(BUDGETS_FILE, JSON.stringify(budgets, null, 2), "utf-8");
  } catch(e) {
     console.error("Write Budgets Error:", e);
  }
}

async function readSavingsGoals(): Promise<SavingsGoal[]> {
  try {
    const data = await fs.readFile(SAVINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      const initial: SavingsGoal[] = [
        { id: '1', name: 'Tabung Kecemasan', targetAmount: 10000, currentAmount: 2000, color: '#ef4444' }
      ];
      await writeSavingsGoals(initial);
      return initial;
    }
    return [];
  }
}

async function writeSavingsGoals(data: SavingsGoal[]) {
  try {
     await fs.writeFile(SAVINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch(e) {
     console.error("Write Savings Error:", e);
  }
}

async function readRecurringTransactions(): Promise<RecurringTransaction[]> {
  try {
    const data = await fs.readFile(RECURRING_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error: any) {
    return [];
  }
}

async function writeRecurringTransactions(data: RecurringTransaction[]) {
  try {
     await fs.writeFile(RECURRING_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch(e) {
     console.error("Write Recurring Error:", e);
  }
}

let broadcastUpdate: () => Promise<void>;

async function processRecurringTransactions() {
  const recurring = await readRecurringTransactions();
  if (recurring.length === 0) return;

  const today = new Date();
  // Set to local timezone conceptually, but use UTC for simplicity to match node mostly
  const todayISO = today.toISOString().split('T')[0];
  const [year, month, day] = todayISO.split('-').map(Number);

  let updated = false;
  let transactions = await readData();

  for (const rt of recurring) {
    // If the dayOfMonth matches or it's the end of month and dayOfMonth > last day
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const targetDay = Math.min(rt.dayOfMonth, lastDayOfMonth);

    if (day >= targetDay) {
      const expectedDate = `${year}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      
      // if not processed this month
      if (!rt.lastProcessedDate || rt.lastProcessedDate < expectedDate) {
        // Create transaction
        const newT: Transaction = {
          id: crypto.randomUUID(),
          type: rt.type,
          amount: rt.amount,
          category: rt.category,
          date: expectedDate,
          note: rt.description + ' (Auto)',
          createdAt: Date.now()
        };
        transactions.unshift(newT);
        
        rt.lastProcessedDate = todayISO;
        updated = true;
      }
    }
  }

  if (updated) {
    await writeData(transactions);
    await writeRecurringTransactions(recurring);
    if (broadcastUpdate) {
      await broadcastUpdate();
    }
  }
}

// Run periodically every hour
setInterval(processRecurringTransactions, 60 * 60 * 1000);

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

  broadcastUpdate = async () => {
    const data = await readData();
    const dataStr = JSON.stringify({ type: 'update', data });
    clients.forEach(client => {
      client.write(`data: ${dataStr}\n\n`);
    });
  };

  // Run on startup
  processRecurringTransactions();

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

  app.get("/api/budgets", async (req, res) => {
    const budgets = await readBudgets();
    res.json(budgets);
  });

  app.put("/api/budgets", async (req, res) => {
    const newBudgets = req.body;
    await writeBudgets(newBudgets);
    res.json(newBudgets);
    // You could also broadcast this if you want Realtime updates on budgets, 
    // but we can just use another event or rely on refetching.
    // For simplicity, we just broadcast as a general update.
    const dataStr = JSON.stringify({ type: 'budgets_update', data: newBudgets });
    clients.forEach(client => {
      client.write(`data: ${dataStr}\n\n`);
    });
  });

  // SAVINGS API
  app.get("/api/savings_goals", async (req, res) => {
    const data = await readSavingsGoals();
    res.json(data);
  });

  app.post("/api/savings_goals", async (req, res) => {
    const newGoal = req.body;
    if (!newGoal.id) newGoal.id = crypto.randomUUID();
    const data = await readSavingsGoals();
    data.push(newGoal);
    await writeSavingsGoals(data);
    res.json(newGoal);
    
    const dataStr = JSON.stringify({ type: 'savings_update', data });
    clients.forEach(client => client.write(`data: ${dataStr}\n\n`));
  });

  app.put("/api/savings_goals/:id", async (req, res) => {
    const { id } = req.params;
    const update = req.body;
    const data = await readSavingsGoals();
    const index = data.findIndex(g => g.id === id);
    if (index !== -1) {
       data[index] = { ...data[index], ...update };
       await writeSavingsGoals(data);
       res.json(data[index]);
       const dataStr = JSON.stringify({ type: 'savings_update', data });
       clients.forEach(client => client.write(`data: ${dataStr}\n\n`));
    } else {
       res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/savings_goals/:id", async (req, res) => {
    const { id } = req.params;
    let data = await readSavingsGoals();
    data = data.filter(g => g.id !== id);
    await writeSavingsGoals(data);
    res.json({ success: true });
    const dataStr = JSON.stringify({ type: 'savings_update', data });
    clients.forEach(client => client.write(`data: ${dataStr}\n\n`));
  });

  // RECURRING API
  app.get("/api/recurring_transactions", async (req, res) => {
    const data = await readRecurringTransactions();
    res.json(data);
  });

  app.post("/api/recurring_transactions", async (req, res) => {
    const newReq = req.body;
    if (!newReq.id) newReq.id = crypto.randomUUID();
    const data = await readRecurringTransactions();
    data.push(newReq);
    await writeRecurringTransactions(data);
    res.json(newReq);
    
    // Evaluate if we need to process it right away
    await processRecurringTransactions();

    const dataStr = JSON.stringify({ type: 'recurring_update', data });
    clients.forEach(client => client.write(`data: ${dataStr}\n\n`));
  });

  app.put("/api/recurring_transactions/:id", async (req, res) => {
    const { id } = req.params;
    const update = req.body;
    const data = await readRecurringTransactions();
    const index = data.findIndex(r => r.id === id);
    if (index !== -1) {
       data[index] = { ...data[index], ...update };
       await writeRecurringTransactions(data);
       res.json(data[index]);
       
       const dataStr = JSON.stringify({ type: 'recurring_update', data });
       clients.forEach(client => client.write(`data: ${dataStr}\n\n`));
    } else {
       res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/recurring_transactions/:id", async (req, res) => {
    const { id } = req.params;
    let data = await readRecurringTransactions();
    data = data.filter(r => r.id !== id);
    await writeRecurringTransactions(data);
    res.json({ success: true });
    
    const dataStr = JSON.stringify({ type: 'recurring_update', data });
    clients.forEach(client => client.write(`data: ${dataStr}\n\n`));
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
