import fs from 'node:fs/promises';
import path from 'node:path';
const config = await fs.readFile(path.join(process.env.USERPROFILE, '.wrangler/config/default.toml'), 'utf8');
const token = config.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
if (!token) throw new Error('No current Wrangler OAuth credential found');
for (const endpoint of ['workers/scripts', 'subscriptions', 'workers/account-settings']) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/3218be7fd3453af56a94673b5678580b/${endpoint}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    console.log(JSON.stringify({ endpoint, status: response.status, success: data.success, errors: data.errors,
        result: endpoint === 'workers/scripts' ? { count: data.result?.length, archiveTargetExists: data.result?.some(worker => worker.id === 'starisdons-archive-assets'), existingArchive: data.result?.filter(worker => worker.id === 'starisdons-swf-worker').map(worker => ({ id: worker.id, usage_model: worker.usage_model })) }
            : endpoint === 'subscriptions' ? data.result?.map(subscription => ({ plan: subscription.rate_plan, state: subscription.state, frequency: subscription.frequency })) : data.result }));
}
