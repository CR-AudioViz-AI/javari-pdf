import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, template } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Generate content using GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional document writer. Generate well-structured, professional content based on the user's request. The template type is: ${template}. 

Format your response as a JSON array of sections, where each section has:
- "content": the actual text content
- "isHeading": true if this is a heading/title, false for body text

Example response:
[
  {"content": "Executive Summary", "isHeading": true},
  {"content": "This report provides an overview of...", "isHeading": false},
  {"content": "Key Findings", "isHeading": true},
  {"content": "Our analysis reveals...", "isHeading": false}
]

Provide 3-5 sections of content that are professional, clear, and well-written.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const responseText = completion.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No content generated')
    }

    // Parse the JSON response
    let sections
    try {
      sections = JSON.parse(responseText)
    } catch (parseError) {
      // If JSON parsing fails, create a simple structure
      sections = [
        { content: 'Generated Content', isHeading: true },
        { content: responseText, isHeading: false }
      ]
    }

    return NextResponse.json({ 
      success: true,
      sections
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('AI generation error:', message)
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'