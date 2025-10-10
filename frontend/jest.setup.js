require('@testing-library/jest-dom');

// Mock next-intl for tests (avoid ESM transform issues)
jest.mock('next-intl', () => {
  const { messages } = require('./src/i18n');
  function get(obj, path) {
    const parts = String(path || '').split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
      else return undefined;
    }
    return cur;
  }
  function format(str, vars) {
    if (!vars) return str;
    return String(str).replace(/{{\s*(\w+)\s*}}/g, (_, k) => (k in vars ? String(vars[k]) : ''));
  }
  return {
    NextIntlClientProvider: ({ children }) => children,
    useTranslations: (ns) => {
      return (key, vars) => {
        const base = messages.nl || {};
        const full = ns ? `${ns}.${key}` : key;
        const val = get(base, full) || full;
        return format(val, vars);
      };
    },
    useFormatter: () => ({
      dateTime: (d) => String(d),
      number: (n) => String(n),
    }),
  };
});
