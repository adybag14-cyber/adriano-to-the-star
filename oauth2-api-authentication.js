function oauth2Auth({ token, verify } = {}) {
    return (req, res, next) => {
        const header = req.headers['authorization'] || '';
        const parts = header.split(' ');
        const provided = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
        let ok = false;
        if (verify && typeof verify === 'function') {
            try { ok = !!verify(provided); } catch (_) { ok = false; }
        } else if (token) {
            ok = provided === token;
        } else {
            ok = !!provided;
        }
        if (!ok) return res.status(401).json({ error: 'unauthorized' });
        next();
    };
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = oauth2Auth;
}
