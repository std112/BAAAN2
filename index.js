const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Replace this with your actual Steam Web API key
const STEAM_API_KEY = '';

app.use(cors());

app.get('/profile', async (req, res) => {
    const profileUrl = req.query.url;

    if (!profileUrl) {
        return res.status(400).json({ error: 'Missing profile URL' });
    }

    try {
        const profileIdMatch = profileUrl.match(/\/(id|profiles)\/([^\/]+)/);
        if (!profileIdMatch) {
            return res.status(400).json({ error: 'Invalid Steam profile URL format.' });
        }

        let steamId;

        if (profileIdMatch[1] === 'id') {
            // Vanity URL -> Resolve to steamid
            const resolveRes = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${profileIdMatch[2]}`);
            const resolveData = await resolveRes.json();
            if (!resolveData.response || !resolveData.response.steamid) {
                return res.status(404).json({ error: 'Steam user not found.' });
            }
            steamId = resolveData.response.steamid;
        } else {
            steamId = profileIdMatch[2];
        }

        const detailsRes = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`);
        const detailsData = await detailsRes.json();
        const player = detailsData.response.players[0];

        if (!player) {
            return res.status(404).json({ error: 'Steam user not found.' });
        }

        res.json({
            name: player.personaname,
            avatar: player.avatarfull
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
