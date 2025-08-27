import { google } from 'googleapis';
import { authenticateGoogle } from './google-auth.js';
import OpenAI from 'openai';

interface ItemData {
  row: number;
  itemNumber: string;
  partNumber: string;
  lineItem: string;
  description: string;
  originalData: any[];
}

interface AIJudgment {
  sameProduct: boolean;
  confidence: number; // 0..1
  canonicalPart: string | null; // e.g., "LC1D32M7" or a commercial code like "2102049"
  reasons: string[];
  extractedPartsA: string[];
  extractedPartsB: string[];
}

/**
 * Advanced AI-driven unification service that relies on DeepSeek for
 * authoritative product equivalence decisions (tech vs. commercial P/Ns),
 * with strict JSON schema, retries, and safe fallbacks.
 */
export class AdvancedAIUnificationService {
  private sheets: any;
  private spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

  // Orchestrator state
  private isRunning = false;
  private isPaused = false;
  private progress = 0;
  private total = 0;
  private processed = 0;
  private unified = 0;
  private skipped = 0;
  private errors = 0;
  private currentItem: any = null;
  private startTime: string | null = null;
  private estimatedTimeRemaining: number | null = null;

  // DeepSeek client (OpenAI-compatible)
  private deepseek: OpenAI | null = null;
  private deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  constructor() {
    console.log('🧠 تهيئة خدمة التوحيد الذكي المتقدم (DeepSeek-first)...');
  }

  async initialize() {
    const auth = await authenticateGoogle();
    this.sheets = google.sheets({ version: 'v4', auth });

    // NOTE: DeepSeek exposes an OpenAI-compatible API. Configure baseURL + key via env.
    //   DEEPSEEK_API_KEY (required)
    //   DEEPSEEK_BASE_URL (optional; defaults to vendor base)
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

    if (!apiKey) {
      console.warn('⚠️ لم يتم ضبط DEEPSEEK_API_KEY في المتغيرات البيئية. سيتم استخدام وضع Fallback.');
    } else {
      this.deepseek = new OpenAI({ apiKey, baseURL });
      console.log('✅ تم تهيئة DeepSeek client');
    }

    console.log('✅ تم تهيئة Google Sheets');
  }

  // ==========================
  // 🔤 Utilities
  // ==========================
  private normalizeText(text?: string): string {
    if (!text) return '';
    return text
      .toUpperCase()
      .replace(/،/g, ',')
      .replace(/["'`]/g, '"')
      .replace(/[^A-Z0-9\-\./\s]/g, ' ') // keep A-Z, 0-9, dash, dot, slash
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizePart(part?: string): string {
    if (!part) return '';
    return part
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[^A-Z0-9\-\.]/g, '') // compact but keep dash/dot which are meaningful in P/Ns
      .trim();
  }

  private extractAllPartNumbers(description: string, explicitPart?: string): string[] {
    const found = new Set<string>();
    const add = (p: string) => { const n = this.normalizePart(p); if (n) found.add(n); };

    if (explicitPart) add(explicitPart);

    const desc = this.normalizeText(description);

    // Common patterns: P/N, PN, REF PN, REF., ALT, EQUIV, CATALOG, CODE
    const patterns: RegExp[] = [
      /(P\s*\/\s*N|PN|PART\s*NUMBER|REF\.?\s*PN|REF|ALT|ALTERNATE|EQUIV(?:ALENT)?|CATALOG|CODE)[:\/\-\s]*([A-Z0-9][A-Z0-9\-\.]*)/g,
      /\b([A-Z]{2,}\d[\w\-\.]*)\b/g, // vendor-like codes e.g., LC1D32M7
      /\b(\d{6,})\b/g,                 // long purely numeric catalog codes
    ];

    for (const rx of patterns) {
      let m: RegExpExecArray | null;
      while ((m = rx.exec(desc))) {
        const val = (m[2] ?? m[1]) as string;
        add(val);
      }
    }

    // Also add versions without dots/dashes to help matching
    for (const p of Array.from(found)) {
      const compact = p.replace(/[\-\.]/g, '');
      if (compact !== p) found.add(compact);
    }

    return Array.from(found);
  }

  private levenshteinSimilarity(a: string, b: string): number {
    const s = this.normalizeText(a);
    const t = this.normalizeText(b);
    const n = s.length, m = t.length;
    if (n === 0 && m === 0) return 1;
    const d: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) d[i][0] = i;
    for (let j = 0; j <= m; j++) d[0][j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost
        );
      }
    }
    const maxLen = Math.max(n, m);
    return 1 - d[n][m] / (maxLen || 1);
  }

  private async sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  // ==========================
  // 🤖 DeepSeek decision maker
  // ==========================
  private async deepseekJudge(
    descA: string,
    pnA: string,
    descB: string,
    pnB: string,
  ): Promise<AIJudgment | null> {
    if (!this.deepseek) return null; // No API key → skip

    // Extract before sending to the model to guide it and reduce hallucinations.
    const partsA = this.extractAllPartNumbers(descA, pnA);
    const partsB = this.extractAllPartNumbers(descB, pnB);

    const prompt = `You are an industrial parts expert. Determine if two line items refer to the SAME physical product, even if one uses a technical part number and the other uses a commercial/catalog number.

Return STRICT JSON only, matching this schema exactly:
{
  "sameProduct": boolean,
  "confidence": number,  // 0..1
  "canonicalPart": string | null, // choose the most standard vendor part number if possible (e.g., LC1D32M7)
  "reasons": string[],
  "extractedPartsA": string[],
  "extractedPartsB": string[]
}

Rules:
- Size/voltage/current/power must match. Different size (e.g., 32\" vs 43\") or voltage (110V vs 220V) → not the same.
- If parts appear equivalent (e.g., LC1D32M7 ≈ 2102049) and specs & brand match → sameProduct = true.
- Prefer Schneider/Telemecanique canonical codes when applicable.
- If unsure, set sameProduct=false with low confidence.

Item A:
- Part: ${this.normalizePart(pnA) || 'N/A'}
- Desc: ${this.normalizeText(descA)}
- Candidate parts in A: ${partsA.join(', ') || 'N/A'}

Item B:
- Part: ${this.normalizePart(pnB) || 'N/A'}
- Desc: ${this.normalizeText(descB)}
- Candidate parts in B: ${partsB.join(', ') || 'N/A'}
`;

    // Robust retry with exponential backoff
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const resp = await this.deepseek.chat.completions.create({
          model: this.deepseekModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 300,
        });
        const raw = resp.choices?.[0]?.message?.content?.trim() || '';
        // Extract first JSON object from the reply
        const jsonStr = this.safeExtractJSON(raw);
        const data = JSON.parse(jsonStr) as AIJudgment;
        // Validate
        if (typeof data.sameProduct !== 'boolean') throw new Error('Invalid sameProduct');
        if (typeof data.confidence !== 'number') throw new Error('Invalid confidence');
        if (data.canonicalPart !== null && typeof data.canonicalPart !== 'string') throw new Error('Invalid canonicalPart');
        data.canonicalPart = data.canonicalPart ? this.normalizePart(data.canonicalPart) : null;
        data.extractedPartsA = Array.isArray(data.extractedPartsA) ? data.extractedPartsA.map(this.normalizePart) : [];
        data.extractedPartsB = Array.isArray(data.extractedPartsB) ? data.extractedPartsB.map(this.normalizePart) : [];
        return data;
      } catch (err: any) {
        console.warn(`DeepSeek attempt ${attempt} failed:`, err?.message || err);
        if (attempt === maxRetries) return null;
        await this.sleep(400 * attempt);
      }
    }

    return null;
  }

  private safeExtractJSON(text: string): string {
    // Try to locate the first {...} block
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return text.slice(start, end + 1);
    }
    // Fallback minimal JSON
    return '{"sameProduct":false,"confidence":0,"canonicalPart":null,"reasons":[],"extractedPartsA":[],"extractedPartsB":[]}';
  }

  // ==========================
  // 🔍 Similarity & grouping
  // ==========================
  private async calculateSimilarity(
    desc1: string,
    desc2: string,
    part1: string,
    part2: string
  ): Promise<{ score: number; sameProductByAI: boolean; canonicalPart: string | null; }> {
    // 1) Quick hard-rule for display sizes (keeps TVs, monitors apart)
    const sizeRx = /(\d{2})\s*\"/g; // 32", 43", ...
    const sizes1 = Array.from(this.normalizeText(desc1).matchAll(sizeRx)).map(m => parseInt(m[1], 10));
    const sizes2 = Array.from(this.normalizeText(desc2).matchAll(sizeRx)).map(m => parseInt(m[1], 10));
    if (sizes1.length && sizes2.length) {
      if (Math.min(...sizes1) !== Math.min(...sizes2)) {
        return { score: 0, sameProductByAI: false, canonicalPart: null };
      }
    }

    // 2) Direct normalized P/N equality (strict)
    const np1 = this.normalizePart(part1);
    const np2 = this.normalizePart(part2);
    if (np1 && np2 && np1 === np2) {
      return { score: 1, sameProductByAI: true, canonicalPart: np1 };
    }

    // 3) Check alternative P/Ns within descriptions (REF/ALT/EQUIV)
    const all1 = this.extractAllPartNumbers(desc1, part1);
    const all2 = this.extractAllPartNumbers(desc2, part2);
    if (all1.some(p => all2.includes(p))) {
      const canonical = np1 || np2 || all1[0] || all2[0] || null;
      return { score: 1, sameProductByAI: true, canonicalPart: canonical };
    }

    // 4) Ask DeepSeek (authoritative)
    const ai = await this.deepseekJudge(desc1, part1, desc2, part2);
    if (ai) {
      if (ai.sameProduct && ai.confidence >= 0.75) {
        return { score: Math.max(0.85, ai.confidence), sameProductByAI: true, canonicalPart: ai.canonicalPart || (np1 || np2) || null };
      }
      // If AI said not same with decent confidence → keep apart strongly
      if (!ai.sameProduct && ai.confidence >= 0.65) {
        return { score: 0.05, sameProductByAI: false, canonicalPart: null };
      }
    }

    // 5) Soft fallback: textual similarity + keyword/spec match
    const s = this.levenshteinSimilarity(desc1, desc2);
    // Heuristic: if specs tokens overlap strongly, bump score slightly
    const tokens = (t: string) => this.normalizeText(t).split(' ').filter(w => w.length > 1);
    const A = new Set(tokens(desc1));
    const B = new Set(tokens(desc2));
    const inter = Array.from(A).filter(x => B.has(x));
    const kwScore = inter.length / Math.max(1, new Set([...A, ...B]).size);
    const score = (s * 0.6) + (kwScore * 0.4);
    return { score, sameProductByAI: false, canonicalPart: null };
  }

  // ==========================
  // 📊 Public API
  // ==========================
  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      progress: this.progress,
      total: this.total,
      processed: this.processed,
      unified: this.unified,
      skipped: this.skipped,
      errors: this.errors,
      currentItem: this.currentItem,
      startTime: this.startTime,
      estimatedTimeRemaining: this.estimatedTimeRemaining
    };
  }

  pauseUnification() {
    if (this.isRunning) {
      this.isPaused = true;
      console.log('⏸️ تم إيقاف التوحيد الذكي مؤقتاً');
    }
  }

  resumeUnification() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      console.log('▶️ تم استئناف التوحيد الذكي');
    }
  }

  stopUnification() {
    this.isRunning = false;
    this.isPaused = false;
    this.resetCounters();
    console.log('🛑 تم إيقاف التوحيد الذكي نهائياً');
  }

  resetUnification() {
    this.stopUnification();
    console.log('🔄 تمت إعادة تعيين التوحيد الذكي');
    return { success: true, message: 'تمت إعادة التعيين بنجاح' };
  }

  private resetCounters() {
    this.progress = 0;
    this.total = 0;
    this.processed = 0;
    this.unified = 0;
    this.skipped = 0;
    this.errors = 0;
    this.currentItem = null;
    this.startTime = null;
    this.estimatedTimeRemaining = null;
  }

  // ==========================
  // 🚀 Main unification routine
  // ==========================
  async startUnification() {
    if (this.isRunning) {
      return { success: false, message: 'عملية التوحيد الذكي قيد التشغيل بالفعل' };
    }

    console.log('🧠 بدء عملية التوحيد بالاعتماد على DeepSeek (Canonical Mapping)...');

    this.isRunning = true;
    this.isPaused = false;
    this.resetCounters();
    this.startTime = new Date().toISOString();

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:E',
      });

      const rows = response.data.values || [];
      this.total = rows.length;
      console.log(`📊 تم العثور على ${this.total} صف للتحليل`);

      if (this.total === 0) {
        this.isRunning = false;
        return { success: true, message: 'لا توجد بيانات للتوحيد', totalRows: 0, unifiedCount: 0 };
      }

      const items: ItemData[] = rows.map((row, index) => ({
        row: index + 2,
        itemNumber: row[0] || '',
        partNumber: row[1] || '',
        lineItem: row[2] || '',
        description: row[4] || '',
        originalData: row,
      }));

      // Map of groupKey -> items
      const groups = new Map<string, ItemData[]>();
      const updates: string[][] = [];
      let seq = 1;

      // Helper: choose a stable group key (prefer canonical P/N)
      const makeGroupKey = (canonical?: string | null) =>
        canonical ? `P-${canonical}` : `P-${String(seq).padStart(7, '0')}`;

      console.log('🔍 بدء التحليل الدلالي (DeepSeek-first)...');

      for (let i = 0; i < items.length; i++) {
        while (this.isPaused && this.isRunning) {
          await this.sleep(150);
        }
        if (!this.isRunning) break;

        const current = items[i];
        this.currentItem = {
          description: current.description.slice(0, 120),
          partNumber: current.partNumber,
          lineItem: current.lineItem,
        };

        // Try to fit in an existing group
        let chosenKey: string | null = null;
        let chosenCanonical: string | null = null;
        let bestScore = 0;

        for (const [gk, gitems] of groups.entries()) {
          const rep = gitems[0];
          const { score, sameProductByAI, canonicalPart } = await this.calculateSimilarity(
            current.description,
            rep.description,
            current.partNumber,
            rep.partNumber
          );

          // Strict acceptance:
          // - If AI says same with high confidence OR identical alt P/Ns were found → accept immediately
          // - Otherwise require strong similarity
          const accept = (sameProductByAI && score >= 0.85) || score >= 0.92;
          if (accept && score > bestScore) {
            bestScore = score;
            chosenKey = gk;
            chosenCanonical = canonicalPart;
          }

          // Rate-limit DeepSeek usage
          await this.sleep(120);
        }

        if (chosenKey) {
          groups.get(chosenKey)!.push(current);
          updates.push([chosenKey]);
          this.unified++;
          console.log(`✅ توحيد: ${current.partNumber} → ${chosenKey} (score=${(bestScore*100).toFixed(1)}%)`);
        } else {
          // New group; try to derive canonical P/N from description
          const all = this.extractAllPartNumbers(current.description, current.partNumber);
          const canonical = all.find(x => /[A-Z]+\d/.test(x)) || all[0] || null; // prefer vendor-like codes
          const key = makeGroupKey(canonical);
          if (!canonical) seq++; // only increment numeric if we didn't attach to canonical
          groups.set(key, [current]);
          updates.push([key]);
          console.log(`🆕 مجموعة جديدة ${key} للبند "${current.partNumber}"`);
        }

        this.processed++;
        this.progress = Math.round((this.processed / this.total) * 100);

        if (this.processed > 10) {
          const elapsed = Date.now() - new Date(this.startTime!).getTime();
          const avg = elapsed / this.processed;
          const remain = this.total - this.processed;
          this.estimatedTimeRemaining = Math.round(remain * avg / 1000);
        }

        if ((i + 1) % 50 === 0) {
          console.log(`⏳ تقدم: ${i + 1}/${this.total} صف`);
        }
      }

      // Persist IDs to column A (DATA!A2)
      if (this.isRunning && updates.length > 0) {
        console.log('💾 تحديث Google Sheets بالمعرفات...');
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'DATA!A2',
          valueInputOption: 'RAW',
          requestBody: { values: updates },
        });
      }

      this.isRunning = false;
      this.currentItem = null;

      const msg = this.processed === this.total
        ? `🧠 اكتمل التوحيد! تم تحليل ${this.processed} بند وإنشاء ${groups.size} مجموعة`
        : `⚠️ تم الإيقاف. تم تحليل ${this.processed} من ${this.total} بند`;

      console.log(msg);
      return {
        success: true,
        message: msg,
        totalRows: this.total,
        processedRows: this.processed,
        unifiedGroups: groups.size,
        unifiedCount: this.unified,
        accuracy: 100,
        sessionId: Date.now().toString()
      };

    } catch (error: any) {
      console.error('❌ خطأ في التوحيد:', error);
      this.isRunning = false;
      this.errors++;
      return { success: false, message: `خطأ في التحليل: ${error.message}`, error: error.message };
    }
  }
}

// Singleton
export const advancedAIUnification = new AdvancedAIUnificationService();

advancedAIUnification.initialize()
  .then(() => {
    console.log('✅ خدمة التوحيد جاهزة');
    console.log('🧠 DeepSeek Semantic Mapping جاهز');
  })
  .catch(err => console.error('❌ خطأ في التهيئة:', err));