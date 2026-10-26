export async function onRequestGet(context) {
    const { env } = context;
    
    // Query GraphQL Cloudflare (Sama kayak yang di bot Telegram lo)
    const query = `
        query {
            viewer {
                accounts(filter: {accountTag: "${env.CF_ACCOUNT_ID}"}) {
                    rumPageloadEventsAdaptiveGroups(
                        limit: 1
                        filter: { date_geq: "2026-10-01", date_leq: "2026-10-31" }
                    ) {
                        count
                        sum { visits }
                    }
                }
            }
        }
    `;

    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${env.CF_API_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
    });

    const data = await res.json();
    const stats = data.data.viewer.accounts[0].rumPageloadEventsAdaptiveGroups[0];

    return new Response(JSON.stringify({
        visits: stats.sum.visits,
        pageviews: stats.count
    }), {
        headers: { "Content-Type": "application/json" }
    });
}