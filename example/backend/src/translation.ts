export interface TranslateRequest {
    texts: { id: string; text: string }[]
    targetLang: string
    pageContext?: string
}

export interface TranslateResponse {
    translations: { id: string; translatedText: string }[]
}

export async function translateBatch(
    ai: any,
    request: TranslateRequest
): Promise<TranslateResponse> {
    const { texts, targetLang, pageContext } = request

    // If no texts, return empty
    if (texts.length === 0) {
        return { translations: [] }
    }

    // Preserve context by joining texts or providing them in prompt
    // For Manga Dubbing, context between bubbles is important.
    // We use Llama-3 or Mistral for better instruction following than basic translation models.

    const prompt = `
You are a professional manga translator. 
Translate the following dialogue from Japanese (or original) to ${targetLang}.
Context: ${pageContext || 'None'}

Rules:
1. Keep the same meaning and vibe as the original manga.
2. Maintain character distinctiveness if evident.
3. Output the translations in a JSON format compatible with the input structure.
4. ONLY output valid JSON. No explanations.

Input:
${JSON.stringify(texts, null, 2)}
`.trim()

    try {
        const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
            prompt,
        })

        // Extract JSON from response (AI might include backticks or text)
        const aiText = response.response || ''
        const jsonMatch = aiText.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[0] : aiText

        const parsedTranslations = JSON.parse(jsonString)

        // Ensure we map back to IDs correctly
        // The AI might return an array of objects or an object with IDs
        const translations = texts.map((t) => {
            const match = Array.isArray(parsedTranslations)
                ? parsedTranslations.find((pt: any) => pt.id === t.id)
                : parsedTranslations[t.id]

            return {
                id: t.id,
                translatedText: match?.translatedText || match?.text || (typeof match === 'string' ? match : t.text)
            }
        })

        return { translations }
    } catch (e) {
        console.error('AI translation failed', e)
        // Fallback: return original texts
        return {
            translations: texts.map((t) => ({ id: t.id, translatedText: t.text })),
        }
    }
}
