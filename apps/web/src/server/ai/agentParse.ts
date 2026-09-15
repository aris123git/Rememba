export type AgentToolCall = {
  tool: string;
  args: Record<string, string | boolean>;
};

const PERSON_RE =
  /(?:photos?|souvenirs?|images?)\s+(?:de|d’|d')\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,40})/i;
const PERSON_RE_2 = /(?:qui est|personne|montrer)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,40})/i;
const PLACE_RE = /(?:à|au|aux|chez|lieu|endroit)\s+([A-Za-zÀ-ÿ0-9., -]{2,40})/i;
const YEAR_RE = /\b(20\d{2})\b/;

export function parseAgentQuery(raw: string): AgentToolCall[] {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const calls: AgentToolCall[] = [];

  if (!text) {
    return [{ tool: "help", args: {} }];
  }

  if (/doublon/.test(lower)) {
    calls.push({ tool: "searchPhotos", args: { duplicates: true } });
  }
  if (/meilleur|best.?shot|plus nettes?|qualité/.test(lower)) {
    calls.push({ tool: "searchPhotos", args: { bestOnly: true } });
  }
  if (/il y a un an|ce jour|on this day|souvenirs? d['’]?hier/.test(lower) || /anniversaire de ces photos/.test(lower)) {
    calls.push({ tool: "thisDayLastYear", args: {} });
  }
  if (/timeline|ligne du temps|par mois|mémoire|souvenirs? (du|de) mois/.test(lower)) {
    calls.push({ tool: "listMemories", args: {} });
  }
  if (/suggestion|proposition/.test(lower)) {
    calls.push({ tool: "listSuggestions", args: {} });
  }
  if (/événement|evenement|fête|fete|week-?end|anniversaire/.test(lower) && !/créer|invite/.test(lower)) {
    const nameMatch = text.match(/(?:événement|evenement|fête)\s+(.+)$/i);
    calls.push({
      tool: "searchEvents",
      args: nameMatch?.[1] ? { name: nameMatch[1].trim() } : {},
    });
  }
  if (/vidéo|video|montage/.test(lower)) {
    calls.push({ tool: "listVideos", args: {} });
  }
  if (/partage|invitation/.test(lower)) {
    calls.push({ tool: "listShares", args: {} });
  }
  if (/public|code d['’]?accès|organisateur/.test(lower)) {
    calls.push({ tool: "listPublicEvents", args: {} });
  }

  const person = text.match(PERSON_RE) || text.match(PERSON_RE_2);
  const place = text.match(PLACE_RE);
  const year = text.match(YEAR_RE);
  if (person || place || year || /photo/.test(lower)) {
    const args: Record<string, string | boolean> = {};
    if (person?.[1]) args.personName = person[1].trim();
    if (place?.[1] && !/un an|jour/.test(place[1].toLowerCase())) args.place = place[1].trim();
    if (year?.[1]) args.year = year[1];
    if (Object.keys(args).length > 0 || (/photo/.test(lower) && calls.length === 0)) {
      calls.push({ tool: "searchPhotos", args });
    }
  }

  if (calls.length === 0) {
    calls.push({ tool: "searchPhotos", args: { query: text } });
  }
  return calls;
}

export const AGENT_HELP = `Je cherche dans votre bibliothèque Rememba. Exemples :
• photos de Marie
• meilleures photos à Paris
• doublons
• événements du week-end
• souvenirs d’il y a un an
• suggestions
Je n’applique rien tout seul : je montre, vous décidez.`;
