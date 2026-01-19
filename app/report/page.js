"use client"
import Navbar from '@/components/Navbar'
import ScamReportForm from '@/components/ScamReportForm'
import AuthGuard from '@/components/AuthGuard'

export default function ReportPage() {
    return (
        <AuthGuard>
            <ReportContent />
        </AuthGuard>
    )
}

function ReportContent() {
    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '8rem' }}>
                <ScamReportForm />
            </div>
        </main>
    )
}
