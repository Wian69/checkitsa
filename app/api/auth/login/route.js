import { NextResponse } from 'next/server'
export const runtime = 'edge'
import { supabase } from '@/utils/supabase'

export async function POST(req) {
    try {
        const { email, password } = await req.json()

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single()

        if (error || !user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                tier: user.tier || 'free'
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ message: 'Server error' }, { status: 500 })
    }
}
