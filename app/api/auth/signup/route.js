import { NextResponse } from 'next/server'
export const runtime = 'edge'
import { supabase } from '@/utils/supabase'

export async function POST(req) {
    try {
        const { fullName, email, password } = await req.json()

        if (!fullName || !email || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 })
        }

        // Create user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([
                {
                    fullName,
                    email,
                    password,
                    tier: 'free',
                    searches: 0
                }
            ])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            message: 'User created',
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                tier: 'free'
            }
        })
    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json({ message: 'Server error' }, { status: 500 })
    }
}
