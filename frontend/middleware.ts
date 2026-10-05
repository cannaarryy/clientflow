export const config = {
  matcher: ["/demo", "/demo/"],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  url.pathname = "/";
  return new Response(null, {
    status: 307,
    headers: {
      Location: url.toString(),
    },
  });
}