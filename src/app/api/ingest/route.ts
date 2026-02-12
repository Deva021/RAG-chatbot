import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Ingest API is active' })
}
