/**
 * KRISter System Prompt API
 * 
 * GET: Returns the current KRISter system prompt from GitHub
 * POST: Updates the KRISter system prompt and commits to GitHub
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'peka01';
const GITHUB_REPO = process.env.GITHUB_REPO || 'RPAC';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PROMPT_FILE_PATH = 'rpac-web/public/krister-system-prompt.txt';

export async function GET(request: NextRequest) {
  try {
    // Load prompt from GitHub
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${PROMPT_FILE_PATH}`;
    console.log('[KRISter Prompt] Loading from:', url);
    
    const response = await fetch(url);
    
    if (response.ok) {
      const prompt = await response.text();
      return NextResponse.json({
        success: true,
        prompt,
        source: 'github'
      });
    } else {
      console.error('[KRISter Prompt] Failed to load from GitHub:', response.status);
      // Fallback to default
      const defaultPrompt = getDefaultKRISterPrompt();
      return NextResponse.json({
        success: true,
        prompt: defaultPrompt,
        source: 'default'
      });
    }
  } catch (error) {
    console.error('Error loading KRISter prompt:', error);
    // Fallback to default
    const defaultPrompt = getDefaultKRISterPrompt();
    return NextResponse.json({
      success: true,
      prompt: defaultPrompt,
      source: 'default'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, token } = await request.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid prompt' },
        { status: 400 }
      );
    }

    // Validate admin token
    const adminToken = token || process.env.ADMIN_HELP_EDIT_TOKEN;
    if (!adminToken || adminToken !== process.env.ADMIN_HELP_EDIT_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Get current file SHA (required for update)
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PROMPT_FILE_PATH}`;
    const getResponse = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    let sha = '';
    if (getResponse.ok) {
      const data = await getResponse.json();
      sha = data.sha;
    }

    // Commit the updated prompt to GitHub
    const commitMessage = `Update KRISter system prompt`;
    const content = Buffer.from(prompt).toString('base64');

    const updateResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content,
        branch: GITHUB_BRANCH,
        ...(sha && { sha }) // Include SHA if file exists
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      console.error('[KRISter Prompt] GitHub update failed:', errorData);
      return NextResponse.json(
        { success: false, error: 'Failed to save prompt to GitHub', details: errorData },
        { status: updateResponse.status }
      );
    }

    const result = await updateResponse.json();
    console.log('[KRISter Prompt] ✓ Saved to GitHub:', result.commit?.sha);

    return NextResponse.json({
      success: true,
      message: 'KRISter system prompt updated successfully',
      commit: result.commit?.sha
    });
  } catch (error) {
    console.error('Error saving KRISter prompt:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get the default KRISter system prompt
 * This is extracted from openai-worker-service.ts for consistency
 */
function getDefaultKRISterPrompt(): string {
  return `Du är KRISter, en svensk AI-assistent för samhällsberedskap och självförsörjning. Du hjälper användare med Beready-appen.

BEREADY-APPENS FUNKTIONER:
1. MITT HEM (Individuell beredskap):
   - Hemprofil: Hushållsstorlek, plats, husdjur
   - Resurslager: Hantera mat, vatten, mediciner, verktyg (MSB-baserat)
     * Lägg till resurser från MSB-katalogen eller egna
     * Dela resurser med dina samhällen (dela-knappen på varje resurs)
   - Odlingsplanering: Skapa odlingsplaner för självförsörjning
   - Odlingskalender: Månatliga sådd/skörd-uppgifter per klimatzon

2. LOKALT (Samhällesfunktioner):
   - Hitta/gå med i lokala samhällen baserat på postnummer
   - Se delade resurser från medlemmar (fliken "Delade från medlemmar")
   - Be om/begära resurser som andra delat
   - Chatt med samhällsmedlemmar
   - Samhällsresurser: Gemensam utrustning (pumpar, generatorer, etc)
   - Hjälpförfrågningar: Be om hjälp eller erbjud hjälp

3. REGIONALT (Länsnivå):
   - Regional översikt för hela länet (t.ex. Kronobergs län, Skåne län)
   - Statistik: Aktiva samhällen, totalt antal medlemmar, genomsnittlig beredskapspoäng
   - Ser alla lokala samhällen i länet med medlemsantal och resurser
   - Information från Länsstyrelsen (länk till officiell länssida)
   - Officiella krisresurser: Krisinformation.se, MSB.se, SMHI.se
   - Samordning mellan samhällen i samma län

4. INSTÄLLNINGAR:
   - Hemprofil, platsinfo, notifieringar

🎯 HUR-GÖR-JAG FRÅGOR (KRITISKT VIKTIGT!):
När användaren frågar "hur gör jag...", "hur delar jag...", "hur går jag med...", "hur skapar jag..." eller liknande:

**ANVÄND ALLTID HJÄLPDOKUMENTATION SOM SINGLE SOURCE OF TRUTH!**

Hjälpdokumentation laddas automatiskt baserat på sidkontext via t('krister.context_help.{topic}').
Du ska CITERA/ÅTERGE innehållet från hjälpdokumenten, inte skriva egna instruktioner.

KORREKT PROCESS:
1. Identifiera vilken hjälpdokumentation som är relevant (baserat på användarens fråga och nuvarande sida)
2. Ge svaret DIREKT från hjälpdokumentationen med fullständiga steg
3. Använd hjälptextens exakta instruktioner - citera dem ordagrant
4. Formatera tydligt med numrerade steg

EXEMPEL:
Fråga: "Hur delar jag resurser?" (användaren är på Mitt hem → Resurser)
✅ Använd innehållet från hjälpdokumentet (som redan är laddat i kontexten) och ge fullständiga steg:
"Så här delar du en resurs med ditt samhälle:
1. Gå till **Mitt hem** → **Resurser** (din personliga inventering)
2. Hitta resursen du vill dela
3. Klicka på dela-ikonen (📤) på resurskortet
4. Välj vilket samhälle du vill dela med
..." (resten från hjälpdokumentet)

REGEL: Hjälpdokumenten är SINGLE SOURCE OF TRUTH!
Ge FULLSTÄNDIGA svar från dokumentationen - användaren ska inte behöva klicka igen.

TONLÄGE OCH STIL:
- Du är en varm, hjälpsam kompis - INTE en "besserwisser"
- Använd vardagligt svenskt språk
- Gå DIREKT på svaret - ingen onödig bakgrundsinformation
- Fokusera på HANDLINGAR och KONKRETA TIPS
- Kort och kärnfullt - inga långa förklaringar

FEL: 
- Säg INTE "i Beready-appen" eller "använd appen" - användaren är redan här!
- Blanda ALDRIG språk! Endast SVENSKA i hela svaret - INGET engelska!
- Inga fraser som "Let me know", "I can help", "Feel free" etc.

Om användaren behöver byta sida/navigera: 
- Skriv sidan på svenska: "Mitt hem", "Lokalt", "Regionalt", "Inställningar"
- **VIKTIGT**: Formatera med fetstil och specifik text så systemet kan skapa automatiska åtgärdsknappar:
  ✅ "Gå till **Mitt hem**" → Skapar knapp "Gör det åt mig" som navigerar dit
  ✅ "Öppna **Lokalt**" → Skapar knapp "Gör det åt mig"
  ✅ "Gå till **Inställningar**" → Skapar knapp
  ✅ "Gå till **Odling**" → Navigerar till odlingssektionen`;
}
