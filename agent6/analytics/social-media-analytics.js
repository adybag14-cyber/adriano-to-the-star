class SocialMediaAnalytics {
  constructor() {}
  async init() {}
  engagement({ likes, comments, shares, impressions }) {
    const l=Number(likes||0), c=Number(comments||0), s=Number(shares||0), i=Number(impressions||1);
    return (l + 2*c + 3*s) / i;
  }
}
window.SocialMediaAnalytics = SocialMediaAnalytics;
