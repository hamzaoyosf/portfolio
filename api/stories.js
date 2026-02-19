export default async function handler(req, res) {
    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.DATABASE_ID;

    if (!NOTION_TOKEN || !DATABASE_ID) {
        return res.status(500).json({ error: "Missing Notion credentials in environment variables." });
    }

    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filter: {
                    property: "Status",
                    status: { equals: "Published" }
                },
                sorts: [
                    { timestamp: "created_time", direction: "ascending" }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Notion API Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return res.status(200).json([]);
        }

        // Map Notion Page Objects following official reference
        const transformedData = data.results.map(page => {
            const p = page.properties;

            // Media URL Extraction
            let mediaUrl = "";
            const mediaProp = p.Media?.files?.[0];
            if (mediaProp) {
                // Notion's hosted files have expiring URLs, fetching them here ensures they are fresh for the client
                mediaUrl = mediaProp.file?.url || mediaProp.external?.url || "";
            }

            // TextContent: join rich_text array
            const text = p.TextContent?.rich_text?.map(t => t.plain_text).join("") || "";

            // Type Extraction
            const type = p.Type?.select?.name || "image";

            // Duration: number type
            const duration = p.Duration?.number || 5000;

            return {
                type: type.toLowerCase(),
                url: mediaUrl,
                text: text,
                duration: duration
            };
        }).filter(item => item.url || item.type === 'text');

        // Cache the response for 1 minute (optional, but good practice for performance)
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        res.status(200).json(transformedData);
    } catch (error) {
        console.error("Notion Integration Error:", error.message);
        res.status(500).json({ error: error.message });
    }
}
