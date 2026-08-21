(() => {
  const CURRENT_API_URL = 'https://ea888qplbh.execute-api.ap-northeast-1.amazonaws.com/analyze';
  const ANALYZE_API_RE = /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/analyze$/i;

  window.SafetyCheckConfig = Object.freeze({
    ...(window.SafetyCheckConfig || {}),
    apiUrl: CURRENT_API_URL,
  });

  // live.js currently contains the previous PoC endpoint. Keep the endpoint in one
  // small runtime config layer so recreating the operator CloudFormation stack does
  // not require touching the large analysis script immediately.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (url && ANALYZE_API_RE.test(url) && url !== CURRENT_API_URL) {
      if (typeof input === 'string') {
        input = CURRENT_API_URL;
      } else if (input instanceof Request) {
        input = new Request(CURRENT_API_URL, input);
      }
    }
    return nativeFetch(input, init);
  };
})();
