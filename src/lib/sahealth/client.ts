const BASE_URL = "https://www.sahealth.sa.gov.au/wps/themes/html/Portal/js/OBI_DATA/json";

/**
 * SA Health's dashboard JSON endpoints require a browser-like User-Agent
 * (a bare fetch without one gets blocked) but need no auth and no other
 * special headers — confirmed during investigation with plain curl.
 */
async function fetchJson(endpoint: string, timeoutMs = 10_000): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}.json`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; sa-ed-dashboard/1.0)",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`SA Health endpoint ${endpoint} returned HTTP ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const saHealthClient = {
  fetchEtlCntrl: () => fetchJson("ED_Etl_Cntrl"),
  fetchEd001: () => fetchJson("ED001"),
  fetchEd003: () => fetchJson("ED003"),
  fetchEd004: () => fetchJson("ED004"),
  fetchEd005: () => fetchJson("ED005"),
  fetchEd006: () => fetchJson("ED006"),
};
