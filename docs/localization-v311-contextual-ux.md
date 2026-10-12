# V3.11 contextual UX follow-up

Expanded first-party UX coverage with 19 authored strings per locale in all 12 languages. Includes Merli suggestion chips, elevated PSI guidance, More/Hide actions, account context descriptions and accessibility labels. Source-owned readings and route identifiers are not mutated. Import before persona module to prevent a flash of English on initial page load. Browser checks exercise four persona switches and verify actual labels, not just dictionary presence. Native review and full dynamic-state denominator are still pending; development only.

## Shared-surface ownership fix

The V3.10 first-party home and weather dictionaries, integrity tests and source files remain in Git history and the offline asset shell. The V3.11 bridge is the **only active home/weather DOM observer**. Removed the two redundant V3.10 bootstrap imports to prevent V3.10 and V3.11 translations from competing over the same nodes after language, persona, weather and transport updates. V3.10 browser regression now tests the current V3.11-owned rendered screen; static V3.10 content verification remains.
