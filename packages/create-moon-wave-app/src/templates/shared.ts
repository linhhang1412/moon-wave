export function tsconfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        lib: ['ES2022'],
        types: ['@cloudflare/workers-types'],
        strict: true,
        skipLibCheck: true,
      },
      include: ['src'],
    },
    null,
    2,
  );
}

export function gitignore(): string {
  return `node_modules
dist
.wrangler
.dev.vars
`;
}
