
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
    try {
        const body = await req.json();
        const { email, listing_id, title, description, price, category, images } = body;

        if (!email || !listing_id || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        // 1. Verify Ownership: Ensure the listing belongs to the user
        const listing = await db.prepare(
            `SELECT id FROM listings WHERE id = ? AND user_email = ?`
        ).bind(listing_id, email).first();

        if (!listing) {
            return NextResponse.json({ error: 'Unauthorized: Listing not found or does not belong to you.' }, { status: 403 });
        }

        // 2. Insert Product
        // We store the images array as a JSON string in the image_url column
        const imagesJson = JSON.stringify(images || []);

        const { meta } = await db.prepare(
            `INSERT INTO listing_products (listing_id, title, description, price, category, image_url) 
             VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(listing_id, title, description, price, category, imagesJson).run();

        return NextResponse.json({ success: true, productId: meta.last_row_id });

    } catch (error) {
        console.error('Add Product Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const listing_id = searchParams.get('listing_id');

        if (!listing_id) {
            return NextResponse.json({ error: 'Missing listing_id' }, { status: 400 });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        const { results } = await db.prepare(
            `SELECT * FROM listing_products WHERE listing_id = ? ORDER BY created_at DESC`
        ).bind(listing_id).all();

        return NextResponse.json({ products: results || [] });

    } catch (error) {
        console.error('Get Products Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const body = await req.json();
        const { email, product_id } = body;

        if (!email || !product_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        // 1. Verify Ownership via Join
        // We need to check if the product belongs to a listing that belongs to the user
        const product = await db.prepare(
            `SELECT p.id 
             FROM listing_products p
             JOIN listings l ON p.listing_id = l.id
             WHERE p.id = ? AND l.user_email = ?`
        ).bind(product_id, email).first();

        if (!product) {
            return NextResponse.json({ error: 'Unauthorized: Product not found or you do not own it.' }, { status: 403 });
        }

        // 2. Delete Product
        await db.prepare(`DELETE FROM listing_products WHERE id = ?`).bind(product_id).run();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete Product Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
