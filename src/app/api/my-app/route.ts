import { NextRequest, NextResponse } from 'next/server';
import { avalancheFuji } from 'viem/chains';
import { createMetadata, Metadata, ValidatedMetadata, ExecutionResponse } from '@sherrylinks/sdk';
import { serialize } from 'wagmi';
import { abi } from '@/blockchain/abi';

const CONTRACT_ADDRESS = '0x34E066998e34bD9B29509F44Fd658374e017B224';


export async function GET(req: NextRequest) {
    try {
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const serverUrl = `${protocol}://${host}`;

        const metadata: Metadata = {
            url: 'https://sherry.social',
            icon: 'https://avatars.githubusercontent.com/u/117962315',
            title: 'Timestamped Message',
            baseUrl: serverUrl,
            description: 'Store a message with an optimized timestamp calculated by our algorithm',
            actions: [
                {
                    type: 'dynamic',
                    label: 'Store Message',
                    description: 'Store your message with a custom timestamp calculated for optimal storage',
                    chains: { source: 'fuji' },
                    path: `/api/my-app`,
                    params: [
                        {
                            name: 'message',
                            label: 'Your Message Hermano!',
                            type: 'text',
                            required: true,
                            description: 'Enter the message you want to store on the blockchain',
                        },
                    ],
                },
            ],
        };

        // Validate metadata using the SDK
        const validated: ValidatedMetadata = createMetadata(metadata);

        // Return with CORS headers for cross-origin access
        return NextResponse.json(validated, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            },
        });
    } catch (error) {
        console.error('Error creating metadata:', error);
        return NextResponse.json({ error: 'Failed to create metadata' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const message = searchParams.get('message');

        if (!message) {
            return NextResponse.json(
                { error: 'Message parameter is required' },
                {
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    },
                },
            );
        }

        // Calculate optimized timestamp using custom algorithm
        const optimizedTimestamp = calculateOptimizedTimestamp(message);

        // Create smart contract transaction
        const tx = {
            address: CONTRACT_ADDRESS,
            abi: abi,
            functionName: 'storeMessage',
            args: [message, optimizedTimestamp],
        };

        // Serialize transaction
        const serialized = serialize(tx);

        // Create response
        const resp: ExecutionResponse = {
            serializedTransaction: serialized,
            chainId: avalancheFuji.name,
        };

        return NextResponse.json(resp, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    } catch (error) {
        console.error('Error in POST request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function calculateOptimizedTimestamp(message: string): number {
    // Get the current timestamp as a starting point
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Custom algorithm: Add character codes to create a unique offset
    // This is your unique business logic - you can make this as complex as needed
    let offset = 0;

    for (let i = 0; i < message.length; i++) {
        // Sum character codes and use position as a multiplier
        offset += message.charCodeAt(i) * (i + 1);
    }

    // Ensure offset is reasonable (1 hour max)
    const maxOffset = 3600;
    offset = offset % maxOffset;

    // Calculate final optimized timestamp
    return currentTimestamp + offset;
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 204, // No Content
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
                'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
        },
    });
}