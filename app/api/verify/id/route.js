import { NextResponse } from 'next/server'

export const runtime = 'edge'


export async function POST(request) {
    const { idNumber } = await request.json()

    // 1. Basic Format Check (13 Digits)
    if (!/^\d{13}$/.test(idNumber)) {
        return NextResponse.json({ valid: false, message: 'Invalid ID: Must be exactly 13 digits.' }, { status: 400 })
    }

    // 2. Luhn Algorithm Check (Real Validation)
    const luhnCheck = (id) => {
        let sum = 0;
        let isSecond = false;
        for (let i = id.length - 1; i >= 0; i--) {
            let d = parseInt(id.charAt(i));
            if (isSecond) {
                d = d * 2;
                if (d > 9) d -= 9;
            }
            sum += d;
            isSecond = !isSecond;
        }
        return (sum % 10) === 0;
    };

    if (!luhnCheck(idNumber)) {
        return NextResponse.json({ valid: false, message: 'Invalid ID: Failed checksum validation (this ID does not exist).' }, { status: 400 })
    }

    // 3. Extract Data (Real data from the ID number itself)
    const year = idNumber.substring(0, 2)
    const month = idNumber.substring(2, 4)
    const day = idNumber.substring(4, 6)
    const genderCode = parseInt(idNumber.substring(6, 10))
    const citizenshipCode = parseInt(idNumber.charAt(10))

    const currentYear = new Date().getFullYear() % 100
    const fullYear = (parseInt(year) > currentYear ? '19' : '20') + year

    const gender = genderCode >= 5000 ? 'Male' : 'Female'
    const citizenship = citizenshipCode === 0 ? 'SA Citizen' : 'Permanent Resident'

    return NextResponse.json({
        valid: true,
        data: {
            fullName: 'Valid Identity Found', // Note: Name lookup still requires paid Home Affairs API
            dob: `${fullYear}-${month}-${day}`,
            gender: gender,
            citizenship: citizenship,
            status: 'ID Number Structure is Valid',
            issuedDate: 'Verified via Luhn Algorithm'
        }
    })
}
