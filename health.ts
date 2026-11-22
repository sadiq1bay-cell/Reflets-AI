export async function GET(): Promise<Response> {
  return Response.json({
    ok: true,
    hasKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
}
