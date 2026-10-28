import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      "dist/**",
      "node_modules/**",
      "src/components/ui/**",
      "src/hooks/**",
    ],
  },
  {
    rules: {
      // Pre-dates this rule (not part of the Vite project's eslint setup):
      // the whole app loads its data with a `load()` function called from
      // a mount-time useEffect, the standard pre-React-19-compiler pattern.
      // Flagging every one of those would mean restructuring ~20 working
      // data-fetching pages as part of a framework migration that is
      // supposed to leave behavior unchanged.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
