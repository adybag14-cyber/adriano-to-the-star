class WishlistFunctionality {
    constructor() {
        this.lists = new Map();
    }
    add(userId, itemId) {
        const list = this.lists.get(userId) || [];
        if (!list.includes(itemId)) list.push(itemId);
        this.lists.set(userId, list);
        return list;
    }
    remove(userId, itemId) {
        const list = this.lists.get(userId) || [];
        const idx = list.indexOf(itemId);
        if (idx >= 0) list.splice(idx, 1);
        this.lists.set(userId, list);
        return list;
    }
    list(userId) {
        return [...(this.lists.get(userId) || [])];
    }
}
const wishlistFunctionality = new WishlistFunctionality();
if (typeof window !== 'undefined') {
    window.wishlistFunctionality = wishlistFunctionality;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WishlistFunctionality;
}
