export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response(
      `<html><body><script>
        window.opener.postMessage('authorization:github:error:{"message": "No code provided"}', '*');
        window.close();
      </script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'cloudflare-pages-function'
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code
      })
    });

    const data = await response.json();

    if (data.error) {
      return new Response(
        `<html><body><script>
          window.opener.postMessage('authorization:github:error:${JSON.stringify(data.error_description || data.error)}', '*');
          window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const payload = JSON.stringify({
      token: data.access_token,
      provider: 'github'
    });

    const script = `
      <html>
      <body>
      <script>
        (function() {
          const message = 'authorization:github:success:' + ${JSON.stringify(payload)};
          window.opener.postMessage(message, '*');
          window.close();
        })();
      </script>
      </body>
      </html>
    `;

    return new Response(script, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new Response(
      `<html><body><script>
        window.opener.postMessage('authorization:github:error:{"message": "${error.message}"}', '*');
        window.close();
      </script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
