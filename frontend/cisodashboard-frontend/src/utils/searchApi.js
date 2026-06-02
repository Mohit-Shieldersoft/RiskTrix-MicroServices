const BASE = "/api/v1";

const searchApi = {
  /**
  * Unified search — returns { query, total, tickets, assets, agents, policies }
   * GET /api/v1/search?q=...&limit=20
   */
  search: async (q, limit = 20) => {
    const params = new URLSearchParams({ q, limit });
    const res = await fetch(`${BASE}/search?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * Tickets-only search — returns TicketResult[]
   * GET /api/v1/search/tickets?q=...
   */
  searchTickets: async (q, limit = 20) => {
    const params = new URLSearchParams({ q, limit });
    const res = await fetch(`${BASE}/search/tickets?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * Assets-only search — returns AssetResult[]
   * GET /api/v1/search/assets?q=...
   */
  searchAssets: async (q, limit = 20) => {
    const params = new URLSearchParams({ q, limit });
    const res = await fetch(`${BASE}/search/assets?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * Agents-only search — returns AgentResult[]
   * GET /api/v1/search/agents?q=...
   */
  searchAgents: async (q, limit = 20) => {
    const params = new URLSearchParams({ q, limit });
    const res = await fetch(`${BASE}/search/agents?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * Policies-only search — returns PolicyResult[]
   * GET /api/v1/search/policies?q=...
   */
  searchPolicies: async (q, limit = 20) => {
    const params = new URLSearchParams({ q, limit });
    const res = await fetch(`${BASE}/search/policies?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default searchApi;
