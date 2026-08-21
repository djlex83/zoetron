# Marktvalidierung: Kontext-Portabilität („ContextPass"-These)

Datum: 2026-08-21 · Methode: GitHub-API-Recherche + DuckDuckGo via Scrapling-Browser

## These (aus Live-Swarm-Lauf 1)

Ein Kontext-Portabilitätslayer – KI-Gedächtnis/Präferenzen mandantenunabhängig
zwischen ChatGPT/Claude/Gemini & Co. mitnehmen – sei eine unbesetzte Marktlücke.

## Befund

### Kategorie besetzt (Entwickler-Seite, gesättigt)
| Projekt | Stars | Aktivität |
|---|---|---|
| Mem0 (Universal Memory Layer) | ★63.757 | sehr aktiv (täglich) |
| Supermemory | ★28.985 | aktiv |
| Letta/MemGPT | ★24.332 | aktiv |
| Zep | ★4.857 | aktiv |
| Memobase | ★2.852 | zuletzt Jan 2026 |

### Verbraucher-Seite: genau ein direkter Wettbewerber
**mem0 OpenMemory Chrome Extension** (github.com/mem0ai/mem0-chrome-extension):
„Long-term memory for ChatGPT, Claude, Perplexity, Grok etc."
- Launch mit Blogpost (mem0.ai/blog/introducing-the-openmemory-chrome-extension),
  eigener Landingpage (chrome.mem0.ai), Product-Hunt-Eintrag
- ABER: nur ★680 (vs. ★63k Kernprojekt), letzter Push 2026-03-23 → schwache
  Adoption, wirkt eingeschlafen
- An mem0-Cloud gebunden → Vendor-Lock-in, kein offener Standard

## Bewertung

Die Idee ist **nicht** „ein Produkt, das es noch nicht gibt". Der Markt hat die
These ox alphas teilweise schon entdeckt, aber der Verbraucher-Sieger steht nicht
fest: Adoption klein, Wartung stockt, Modell = Cloud-Lock-in.

### Verbleibende Alleinstellungs-Chancen
1. **EU/DSGVO-Winkel:** lokal-first, keine US-Cloud, deutscher Markt zuerst.
2. **Migration statt Synchronisation:** Einmal-Export/Import („Wechsel-Assistent")
   als offenes Portabilitätsformat statt dauerhafter Sync-Dienst → kein Lock-in,
   kein Serverbetrieb, DSGVO-freundlich by design.
3. **Alternative:** völlig andere Lücke wählen – Kandidaten aus Swarm-Lauf 2 prüfen.

## Fazit fürs Projekt

ContextPass in der Sync-Variante: ❌ keine grüne Wiese.
Offenes Portabilitätsformat + Wechsel-Assistent (EU-first): ⚠️ möglicher Nischen-Hebel,
aber Validierungsbedarf zur Zahlungsbereitschaft.
