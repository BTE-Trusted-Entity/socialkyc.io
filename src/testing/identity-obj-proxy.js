// Inspired by https://github.com/keyz/identity-obj-proxy/issues/8#issuecomment-618429796

const proxy = new Proxy(
  {},
  {
    get: (target, key) => Module[key] || key,
  },
);

const Module = {
  __esModule: true, // tricks Jest into seeing the named exports
  default: proxy,
};

module.exports = proxy;
