export type ModelSize = 'small' | 'huge'
export type Hardware = 'gpu' | 'tpu'
export type Hosting = 'cloud' | 'api'

export interface ImageCostInput {
  steps: number
  guided: boolean
  modelSize: ModelSize
  hardware: Hardware
  hosting: Hosting
}

export function computeImageCost({ steps, guided, modelSize, hardware, hosting }: ImageCostInput) {
  let units = steps
  if (guided) units *= 2
  if (modelSize === 'huge') units *= 8
  if (hardware === 'tpu') units *= 0.85
  const rate = hosting === 'api' ? 0.04 : 0.012
  return { units, dollarsPer1k: units * rate }
}

// Illustrative Claude-Sonnet-ish per-million-token rates (USD)
export const TEXT_RATES = {
  inputPerM: 3,
  outputPerM: 15,
}

export function textCost(inputTokens: number, outputTokens: number) {
  const inputCost = (inputTokens / 1_000_000) * TEXT_RATES.inputPerM
  const outputCost = (outputTokens / 1_000_000) * TEXT_RATES.outputPerM
  return { inputCost, outputCost, total: inputCost + outputCost }
}

// Naive char-based tokenizer good enough for teaching (real ones use BPE).
// Splits on whitespace, then chunks long words into ~4-char pieces.
export function fakeTokenize(text: string): string[] {
  if (!text) return []
  const words = text.match(/\S+\s*|\s+/g) ?? []
  const tokens: string[] = []
  for (const w of words) {
    if (w.length <= 5) {
      tokens.push(w)
    } else {
      for (let i = 0; i < w.length; i += 4) {
        tokens.push(w.slice(i, i + 4))
      }
    }
  }
  return tokens
}
