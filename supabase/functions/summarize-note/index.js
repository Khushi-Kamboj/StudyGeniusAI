import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle the browser's security (preflight) request.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  let rawResponseText = "[Not fetched]";

  try {
    const { content } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in Supabase environment variables.");
    }

    // --- DEBUGGING STEP: Using gemini-pro instead of gemini-1.5-flash-latest ---
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful learning assistant. Summarize the following notes into concise points and extract 3-5 key learnings. Respond in a clean JSON format with two keys: a 'summary' (string) and 'keyPoints' (an array of strings). Do not include any other text or formatting in your response.\n\n            Notes to summarize:\n            ${content}`
          }]
        }],
        // Note: gemini-pro does not support JSON response_mime_type, so we remove it for this test
        // generationConfig: {
        //   response_mime_type: "application/json",
        // }
      }),
    });

    rawResponseText = await response.text();

    if (!response.ok) {
      throw new Error(`Gemini API request failed with status: ${response.status}`);
    }

    const data = JSON.parse(rawResponseText);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("The AI model did not return a valid response (no candidates).");
    }

    const candidate = data.candidates[0];

    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0 || !candidate.content.parts[0].text) {
      throw new Error("The AI model returned an unexpected response structure (missing text field).");
    }

    let aiResponseText = candidate.content.parts[0].text;

    // Clean up the response from the model
    if (aiResponseText.startsWith("```json")) {
      aiResponseText = aiResponseText.slice(7, -3).trim();
    }

    const parsedResponse = JSON.parse(aiResponseText);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in summarize-note function:", error.message);
    return new Response(
      JSON.stringify({
        error: `Function crashed: ${error.message}`,
        apiResponse: rawResponseText,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


