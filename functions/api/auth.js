export function onRequest(context) {
  const client_id = context.env.GITHUB_CLIENT_ID;
  const redirect_uri = new URL(context.request.url).origin + '/api/callback';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=repo,user&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  return Response.redirect(githubAuthUrl, 302);
}
