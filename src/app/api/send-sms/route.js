import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, message, job_id, client_name } = body;

    // Log for testing
    console.log('SMS Request received:', { to, message, job_id, client_name });

    // Add your Twilio/SMS logic here
    // For now, just return success
    
    return NextResponse.json({ 
      success: true, 
      message: 'SMS queued',
      data: { to, message, job_id }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}