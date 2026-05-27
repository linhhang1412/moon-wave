export function validateBearer(req: Request, bearerToken: string | undefined): boolean {
  if (!bearerToken) return true; // public / dev mode

  const auth = req.headers.get('Authorization');
  if (!auth) return false;

  const [scheme, token] = auth.split(' ');
  return scheme === 'Bearer' && token === bearerToken;
}

export function unauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Bearer realm="moon-wave"',
      'Content-Type': 'text/plain',
    },
  });
}

// MCP spec: RFC 9728 protected resource metadata
export function protectedResourceMetadata(serverUrl: string): Response {
  return new Response(
    JSON.stringify({
      resource: serverUrl,
      bearer_methods_supported: ['header'],
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
