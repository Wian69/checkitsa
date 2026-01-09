import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export async function POST(req) {
    try {
        const { url, reason, type } = await req.json()

        const { data, error } = await supabase
            .from('reports')
            .insert([
                {
                    url: url || 'N/A',
                    reason: reason || 'N/A',
                    type: type || 'MANUAL'
                }
            ])

        if (error) throw error

        return NextResponse.json({ message: 'Report submitted successfully' })
    } catch (error) {
        console.error('Report submission error:', error)
        return NextResponse.json({ message: 'Error submitting report' }, { status: 500 })
    }
}

export async function GET() {
    try {
        const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) throw error

        return NextResponse.json({ reports: reports || [] })
    } catch (error) {
        console.error('Fetch reports error:', error)
        return NextResponse.json({ reports: [] })
    }
}
