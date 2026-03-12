import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export interface AIAnalysis {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  rootCause: string;
  impact: string;
  recommendations: string[];
  estimatedResolution: string;
  citizenMessage: string;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  try {
    const { service, incidents, latencyHistory } = await req.json();

    const latencyTrend = (latencyHistory as number[]).slice(-20).join(', ');
    const incidentList = (incidents as { message: string; created_at: string }[])
      .slice(0, 5)
      .map((i) => `• ${i.message} (${new Date(i.created_at).toLocaleString('en-IN')})`)
      .join('\n') || 'No recent incidents';

    const fallbackList = (service.fallbacks as { label: string; description: string }[])
      .map((f) => `• ${f.label}: ${f.description}`)
      .join('\n') || 'No fallbacks configured';

    const prompt = `You are an SRE (Site Reliability Engineer) analysing an incident for ResilienceOS — India's government digital services resilience platform.

Analyse this service incident and return ONLY a JSON object. No explanation, no markdown, just raw JSON.

SERVICE: ${service.name} (${service.category} · ${service.region})
STATUS: ${(service.status as string).toUpperCase()}
LATENCY: ${service.latency === 0 ? 'UNREACHABLE (0ms / timeout)' : `${Math.round(service.latency)}ms`}
UPTIME (24h): ${Number(service.uptime).toFixed(1)}%

LATENCY TREND — last 20 readings in ms (oldest → newest):
${latencyTrend}

RECENT INCIDENTS (last 5):
${incidentList}

AVAILABLE FALLBACK ROUTES:
${fallbackList}

Respond with exactly this JSON structure:
{
  "severity": "CRITICAL" | "HIGH" | "MEDIUM",
  "rootCause": "one sentence hypothesis based on the data",
  "impact": "who is affected and estimated citizen impact scale",
  "recommendations": ["action 1", "action 2", "action 3"],
  "estimatedResolution": "e.g. 15-30 minutes or 2-4 hours",
  "citizenMessage": "plain-language message for affected citizens (1-2 sentences, no jargon)"
}`;

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 });
    }

    const analysis: AIAnalysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
