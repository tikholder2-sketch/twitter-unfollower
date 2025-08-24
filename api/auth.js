// Vercel Serverless Function - Twitter OAuth Handler
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { method, query, body } = req;
    const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
    const REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;

    // Environment variables kontrolü
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.status(500).json({ 
            error: 'Twitter API credentials not configured' 
        });
    }

    try {
        switch (method) {
            case 'POST':
                if (query.action === 'token') {
                    return await exchangeCodeForToken(req, res);
                } else if (query.action === 'refresh') {
                    return await refreshUserData(req, res);
                }
                break;
            
            case 'GET':
                if (query.action === 'user') {
                    return await getUserData(req, res);
                } else if (query.action === 'following') {
                    return await getFollowing(req, res);
                } else if (query.action === 'followers') {
                    return await getFollowers(req, res);
                }
                break;
                
            case 'DELETE':
                if (query.action === 'unfollow') {
                    return await unfollowUser(req, res);
                }
                break;
                
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

// Authorization code'u access token ile değiştir
async function exchangeCodeForToken(req, res) {
    const { code, codeVerifier } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
    }

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TWITTER_CLIENT_ID,
        client_secret: process.env.TWITTER_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.TWITTER_REDIRECT_URI,
        code_verifier: codeVerifier || 'dummy_verifier'
    });

    try {
        const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            console.error('Token exchange failed:', tokenData);
            return res.status(400).json({ 
                error: 'Token exchange failed', 
                details: tokenData 
            });
        }

        // Kullanıcı bilgilerini al
        const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            return res.status(400).json({ 
                error: 'Failed to get user data', 
                details: userData 
            });
        }

        return res.status(200).json({
            access_token: tokenData.access_token,
            user: userData.data
        });

    } catch (error) {
        console.error('Token exchange error:', error);
        return res.status(500).json({ 
            error: 'Token exchange failed', 
            message: error.message 
        });
    }
}

// Kullanıcı verilerini yenile
async function refreshUserData(req, res) {
    const { access_token } = req.body;
    
    if (!access_token) {
        return res.status(400).json({ error: 'Access token required' });
    }

    try {
        const response = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(400).json({ 
                error: 'Failed to get user data', 
                details: data 
            });
        }

        return res.status(200).json({ user: data.data });

    } catch (error) {
        return res.status(500).json({ 
            error: 'Failed to refresh user data', 
            message: error.message 
        });
    }
}

// Takip edilen hesapları getir
async function getFollowing(req, res) {
    const { access_token, user_id } = req.query;
    
    if (!access_token || !user_id) {
        return res.status(400).json({ error: 'Access token and user ID required' });
    }

    try {
        let allFollowing = [];
        let nextToken = null;

        do {
            const url = new URL(`https://api.twitter.com/2/users/${user_id}/following`);
            url.searchParams.set('max_results', '1000');
            url.searchParams.set('user.fields', 'profile_image_url');
            
            if (nextToken) {
                url.searchParams.set('pagination_token', nextToken);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                return res.status(400).json({ 
                    error: 'Failed to get following list', 
                    details: data 
                });
            }

            if (data.data) {
                allFollowing = allFollowing.concat(data.data);
            }

            nextToken = data.meta?.next_token;

        } while (nextToken);

        return res.status(200).json({ 
            following: allFollowing,
            count: allFollowing.length 
        });

    } catch (error) {
        return res.status(500).json({ 
            error: 'Failed to get following list', 
            message: error.message 
        });
    }
}

// Takipçileri getir
async function getFollowers(req, res) {
    const { access_token, user_id } = req.query;
    
    if (!access_token || !user_id) {
        return res.status(400).json({ error: 'Access token and user ID required' });
    }

    try {
        let allFollowers = [];
        let nextToken = null;

        do {
            const url = new URL(`https://api.twitter.com/2/users/${user_id}/followers`);
            url.searchParams.set('max_results', '1000');
            url.searchParams.set('user.fields', 'profile_image_url');
            
            if (nextToken) {
                url.searchParams.set('pagination_token', nextToken);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                return res.status(400).json({ 
                    error: 'Failed to get followers list', 
                    details: data 
                });
            }

            if (data.data) {
                allFollowers = allFollowers.concat(data.data);
            }

            nextToken = data.meta?.next_token;

        } while (nextToken);

        return res.status(200).json({ 
            followers: allFollowers,
            count: allFollowers.length 
        });

    } catch (error) {
        return res.status(500).json({ 
            error: 'Failed to get followers list', 
            message: error.message 
        });
    }
}

// Kullanıcıyı takipten çık
async function unfollowUser(req, res) {
    const { access_token, source_user_id, target_user_id } = req.query;
    
    if (!access_token || !source_user_id || !target_user_id) {
        return res.status(400).json({ error: 'Access token, source user ID, and target user ID required' });
    }

    try {
        const response = await fetch(`https://api.twitter.com/2/users/${source_user_id}/following/${target_user_id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(400).json({ 
                error: 'Failed to unfollow user', 
                details: data 
            });
        }

        return res.status(200).json({ 
            success: true,
            following: data.data?.following || false 
        });

    } catch (error) {
        return res.status(500).json({ 
            error: 'Failed to unfollow user', 
            message: error.message 
        });
    }
}
