"use client"
import Navbar from '@/components/Navbar'
import ScamReportForm from '@/components/ScamReportForm'

export default function ReportPage() {
    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '8rem' }}>
                <ScamReportForm />
            </div>
        </main>
    )
}
