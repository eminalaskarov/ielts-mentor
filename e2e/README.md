# E2E (Playwright, iPhone emulation)

    npm run build && npx vite preview --port 4180 &      # serve dist/
    PW_MODULE=/abs/path/to/node_modules/playwright/index.mjs node e2e/qa-e2e.mjs http://127.0.0.1:4180/ all   # webkit | chromium | all

`playwright` is intentionally not in package.json; install it anywhere (`npm i playwright && npx playwright install webkit chromium`)
or leave `PW_MODULE` unset if it is resolvable from this folder. Exit code 1 if any check fails (about 4 min for both engines).
Year-long quiz repetition check: `npx vitest run src/logic/qa-yearquiz.test.ts`.
