import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { generatePartyCode } from '@/utils/partyCodeGenerator';

// In a real application, this would be a database
let parties: Array<{
  id: string;
  code: string;
  name: string;
  description: string;
  date: string;
  location: string;
}> = [];

export async function POST(request: Request) {
  try {
    const { name, description, date, location } = await request.json();

    // Validate required fields
    if (!name || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a unique 6-digit code for the party
    let code: string;
    let isCodeUnique = false;
    let attempts = 0;

    // Attempt to generate a unique party code
    do {
      code = generatePartyCode();
      isCodeUnique = !parties.some(p => p.code === code);
      attempts++;
    } while (!isCodeUnique && attempts < 10); // Limit attempts to prevent infinite loop

    if (!isCodeUnique) {
      return NextResponse.json(
        { error: 'Failed to generate a unique party code. Please try again.' },
        { status: 500 }
      );
    }

    // Create new party object
    const newParty = {
      id: uuidv4(),
      code,
      name,
      description: description || '',
      date,
      location,
    };

    // Store the party (in a real app, this would be a database)
    parties.push(newParty);

    // Return the created party with its code
    return NextResponse.json(newParty, { status: 201 });
  } catch (error) {
    console.error('Error creating party:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating the party.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Party code is required' },
        { status: 400 }
      );
    }

    // Find the party with the matching code
    const party = parties.find(p => p.code === code);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error('Error retrieving party:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while retrieving the party.' },
      { status: 500 }
    );
  }
}