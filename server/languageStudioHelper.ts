export function getLanguageStudioConfig(body: any): { systemInstruction: string, finalPrompt: string } {
    const { tool, prompt, context, sourceLang, targetLang, style, level, goal, scenario, difficulty, action, writingType, audience, tone, length } = body;
    const t = (tool || '').toLowerCase().trim();

    let systemInstruction = 'You are the ultra-fast linguistic AI engine of SUPERAI Language Studio. Provide immediate, precise, high-accuracy answers without filler.';
    let finalPrompt = prompt || '';

    if (t.includes('translate')) {
      const sLang = sourceLang && sourceLang !== 'Auto Detect' ? sourceLang : 'auto-detect';
      const tLang = targetLang || 'English';
      const transStyle = style || 'Natural & Conversational';
      systemInstruction = `You are SUPERAI Universal Fast Translator. Translate accurately from ${sLang} to ${tLang}. Register: ${transStyle}. Provide the natural translation immediately. If relevant, include a brief cultural nuance note.`;
      finalPrompt = `Translate into ${tLang}:\n\n"${prompt}"`;
    } else if (t.includes('grammar') || t.includes('proof')) {
      const isAdvanced = context === 'advanced' || style === 'advanced';
      systemInstruction = `You are SUPERAI Grammar & Style Master. Mode: ${isAdvanced ? 'Advanced Polish' : 'Standard Correction'}. Provide:
### ✅ Corrected Text
(Clean corrected version)
### 🔍 Key Fixes
(List of corrections)
### 💡 Flow & Style Advice`;
      finalPrompt = `Fix and improve grammar:\n\n"${prompt}"`;
    } else if (t.includes('writer') || t.includes('writing')) {
      systemInstruction = `You are SUPERAI Elite Writer. Format: ${writingType || 'General'}. Tone: ${tone || 'Professional'}. Length: ${length || 'Concise'}. Write high-impact, engaging content immediately.`;
      finalPrompt = `Write ${writingType || 'content'}:\n\n${prompt}`;
    } else if (t.includes('learn') || t.includes('academy')) {
      const targetL = targetLang || 'Spanish';
      const userLevel = level || 'Beginner';
      systemInstruction = `You are SUPERAI Fast Language Academy Tutor. Deliver a crisp, structured ${userLevel} lesson for ${targetL}. Include: 1. Core Vocabulary (5 words with IPA), 2. Essential Phrases, 3. Key Grammar Pattern, 4. Mini Practice Question.`;
      finalPrompt = `Generate a rapid ${userLevel} lesson for ${targetL} on topic: "${prompt || 'Daily Fluency'}"`;
    } else if (t.includes('convers') || t.includes('partner') || t.includes('chat')) {
      const chatLang = targetLang || 'Spanish';
      const scen = scenario || 'Daily interaction';
      systemInstruction = `You are an immersive, encouraging language partner in ${chatLang} for the scenario: "${scen}". Difficulty: ${difficulty || 'Beginner'}. Reply naturally, then provide English translation and a suggested reply hint.`;
      finalPrompt = `User: ${prompt}\nAI Partner:`;
    } else if (t.includes('vocab') || t.includes('lexicon')) {
      const tLang = targetLang || 'English';
      systemInstruction = `You are SUPERAI Vocabulary Architect. Build a high-yield list of 6-8 essential terms in ${tLang}. Provide definition, phonetic guide, and example sentence for each.`;
      finalPrompt = `Curate vocabulary for: "${prompt}"`;
    } else if (t.includes('pronunc') || t.includes('coach') || t.includes('phonetic')) {
      const tLang = targetLang || 'English';
      systemInstruction = `You are SUPERAI Pronunciation Coach for ${tLang}. Provide exact IPA, syllable stress guide (CAPITALIZE stressed syllables), mouth/tongue articulation tip, and audio phonetics.`;
      finalPrompt = `Pronunciation breakdown for: "${prompt}"`;
    } else if (t.includes('summar') || t.includes('simplify')) {
      const act = action || 'summarize';
      systemInstruction = `You are SUPERAI Fast Text Synthesis Specialist. Action: ${act.toUpperCase()}. Provide a concise summary followed by 3-5 bullet takeaways. Be direct and clear.`;
      finalPrompt = `Perform "${act}" on:\n\n"${prompt}"`;
    } else if (t.includes('dict') || t.includes('lexic')) {
      const tLang = targetLang || 'English';
      systemInstruction = `You are SUPERAI Quick Lexicon Dictionary for ${tLang}. Provide Part of Speech, IPA pronunciation, primary definitions, 2 example sentences, and synonyms.`;
      finalPrompt = `Define: "${prompt}" in ${tLang}`;
    } else {
      systemInstruction = context || 'You are SUPERAI Language Assistant. Answer accurately, concisely, and immediately.';
      finalPrompt = prompt;
    }

    return { systemInstruction, finalPrompt };
}

