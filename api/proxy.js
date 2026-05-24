export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. 获取前端传来的 AppID
    const { appId } = req.query;
    if (!appId) {
        return res.status(400).json({ error: "你是白痴吗？没传 AppID。" });
    }

    try {
        const targetUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
        const response = await fetch(targetUrl);
        
        if (!response.ok) {
            throw new Error(`Steam 服务器返回错误: ${response.status}`);
        }

        const data = await response.json();
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}