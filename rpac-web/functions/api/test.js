// Simple test function to verify Cloudflare Pages Functions are working
export async function onRequest(context) {
  return new Response(JSON.stringify({ 
    message: "Cloudflare Pages Functions are working!",
    timestamp: new Date().toISOString(),
    method: context.request.method,
    url: context.request.url
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
