"use client"
import Navbar from '@/components/Navbar'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function TrafficReporter() {
    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [offense, setOffense] = useState('Reckless Driving')
    const [location, setLocation] = useState('')
    const [coords, setCoords] = useState(null)
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [mapLoaded, setMapLoaded] = useState(false)
    const fileInputRef = useRef(null)
    const mapRef = useRef(null)

    const getGeolocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser")
            return
        }

        setLocation("📍 Fetching precise coordinates...")
        setError("")

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

        const success = (position) => {
            const { latitude, longitude } = position.coords
            setCoords({ lat: latitude, lng: longitude })
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        }

        const failure = (err) => {
            console.error("Location error (High Accuracy):", err)

            // Fallback to low accuracy if high accuracy fails or times out
            if (options.enableHighAccuracy) {
                setLocation("📍 Using network-based location...")
                navigator.geolocation.getCurrentPosition(success, (err2) => {
                    console.error("Location error (Low Accuracy):", err2)
                    setLocation("")
                    let msg = "Unable to retrieve location."
                    if (err2.code === 1) msg = "Location access denied. Please enable GPS permissions."
                    else if (err2.code === 3) msg = "Location request timed out. Please enter manually."
                    setError(msg)
                    alert(msg)
                }, { enableHighAccuracy: false, timeout: 10000 })
            }
        }

        navigator.geolocation.getCurrentPosition(success, failure, options)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImage(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!image) return

        setLoading(true)
        try {
            const res = await fetch('/api/verify/traffic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image,
                    location,
                    lat: coords?.lat,
                    lng: coords?.lng,
                    offense,
                    description,
                    reporter_name: 'CheckItSA User'
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to process report')
            setResult(data)
        } catch (err) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const openWhatsApp = () => {
        const msg = `🚔 *ROAD SENTINEL REPORT*\n\nVehicle: ${result?.plate}\nOffense: ${offense}\nLocation: ${location}\nDetails: ${description}\n\nPhoto evidence attached in report ID: ${result?.success}.`
        window.open(`https://wa.me/27814106338?text=${encodeURIComponent(msg)}`, '_blank')
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            {loading && <LoadingOverlay message="AI Extracting Plate..." />}

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '900px' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6 font-outfit">
                        Road Sentinel
                    </h1>
                    <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
                        High-accuracy AI incident reporting. Identify reckless drivers and notify authorities instantly.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
                    {!result ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div
                                className="group relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:bg-white/5 transition-all overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.02)', minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {image ? (
                                    <div className="relative w-full h-full flex flex-col items-center">
                                        <img src={image} alt="Preview" className="max-h-64 rounded-xl shadow-2xl border border-white/10" />
                                        <button
                                            type="button"
                                            onClick={() => setImage(null)}
                                            className="mt-4 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-full transition-colors font-bold border border-red-500/20"
                                        >
                                            ✕ Remove Photo
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📸</div>
                                        <div className="text-lg font-bold text-white mb-2">Vehicle Photo Evidence</div>
                                        <div className="text-sm text-gray-500 max-w-xs mx-auto mb-6">Ensure the license plate is clearly visible</div>

                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="btn btn-outline"
                                            style={{ padding: '0.6rem 2rem' }}
                                        >
                                            Browse Files or Camera
                                        </button>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2 animate-pulse">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-400">Offense Type</label>
                                    <select
                                        value={offense}
                                        onChange={(e) => setOffense(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            borderRadius: '0.5rem',
                                            background: '#0f172a',
                                            border: '1px solid var(--color-border)',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                        className="focus:border-blue-500 transition-colors"
                                    >
                                        <option value="Reckless Driving" style={{ background: '#0f172a' }}>Reckless Driving</option>
                                        <option value="Speeding" style={{ background: '#0f172a' }}>Speeding</option>
                                        <option value="Skipped Red Light" style={{ background: '#0f172a' }}>Skipped Red Light</option>
                                        <option value="Illegal Overtaking" style={{ background: '#0f172a' }}>Illegal Overtaking</option>
                                        <option value="Unroadworthy Vehicle" style={{ background: '#0f172a' }}>Unroadworthy Vehicle</option>
                                        <option value="Other" style={{ background: '#0f172a' }}>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-400">Exact Location</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="e.g. N1 South, William Nicol"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem',
                                                paddingRight: '3rem',
                                                borderRadius: '0.5rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--color-border)',
                                                color: 'white'
                                            }}
                                            className="focus:border-blue-400 transition-all outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={getGeolocation}
                                            title="Use my GPS location"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-white/5"
                                        >
                                            📍
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-400">Description</label>
                                <textarea
                                    rows="3"
                                    placeholder="Briefly describe the incident..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !image}
                                className="btn btn-primary w-full py-4 text-lg"
                            >
                                {loading ? '🤖 AI Extracting Plate...' : '🚀 Submit Report'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
                                <div className="text-5xl mb-4">✅</div>
                                <h2 className="text-2xl font-bold mb-2 text-white">Report Logged</h2>
                                <p className="text-gray-400">AI identified vehicle plate:</p>
                                <div className="text-4xl font-mono font-bold text-emerald-400 mt-2 p-4 bg-black/40 rounded-xl inline-block border border-emerald-500/20">
                                    {result.plate}
                                </div>
                                <p className="mt-4 text-sm text-gray-400">
                                    <span className="text-blue-400 font-bold uppercase tracking-wider">{result.details?.province || 'South Africa'}</span><br />
                                    {result.details?.vehicle_description || 'Unknown Vehicle'}
                                </p>
                                <div className="mt-6 flex items-center justify-center gap-2 text-yellow-500 font-bold text-sm bg-yellow-500/10 py-2 px-4 rounded-full border border-yellow-500/20 max-w-xs mx-auto">
                                    <span>⏳</span> Pending Admin Verification
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                                    <span>📩</span> Next Steps
                                </h3>
                                <div className="space-y-4">
                                    <button
                                        onClick={openWhatsApp}
                                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg"
                                    >
                                        <span>💬</span> Send WhatsApp to JMPD
                                    </button>
                                    <p className="text-xs text-center text-gray-500 px-4">
                                        We have also added this to the CheckItSA database and will notify the RTCC (National Traffic Call Centre) automatically.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setResult(null)}
                                className="w-full py-3 text-gray-500 hover:text-white transition-colors font-medium"
                            >
                                Submit another report
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-sm text-gray-500 bg-white/5 p-4 rounded-xl border border-white/10 mb-12 italic text-center">
                    <strong>Legal Notice:</strong> Knowingly submitting false reports to traffic authorities is a criminal offense in South Africa.
                </div>

                {/* Map View Intelligence */}
                <div className="mb-20">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                        <span className="bg-blue-500/20 p-2 rounded-lg text-blue-400">🌍</span> Incident Map Intelligence
                    </h2>
                    <div className="glass-panel overflow-hidden border border-white/10 shadow-2xl" style={{ height: '500px', borderRadius: '1.5rem', position: 'relative' }}>
                        <div id="map" style={{ height: '100%', width: '100%', background: '#020617' }}></div>
                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-[1000] text-gray-500 italic">
                                Loading real-time incident map...
                            </div>
                        )}
                    </div>
                </div>

                {/* Wall of Shame Feed */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                        <span className="bg-purple-500/20 p-2 rounded-lg text-purple-400">📢</span> Community Wall of Shame
                    </h2>
                    <div className="grid gap-4">
                        <RecentReports />
                    </div>
                </div>
            </div>

            <Script
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                onLoad={() => {
                    setMapLoaded(true)
                }}
            />
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />
            <Script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js" />
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css"
            />
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css"
            />

            <MapInitializer reports={result ? [result] : []} mapLoaded={mapLoaded} />
        </main>
    )
}

function MapInitializer({ reports: newReports, mapLoaded }) {
    const mapInstance = useRef(null)
    const [allReports, setAllReports] = useState([])

    useEffect(() => {
        if (!mapLoaded || typeof L === 'undefined' || typeof L.markerClusterGroup === 'undefined') {
            // Re-check once more after a small delay if L is loaded but markerClusterGroup isn't yet
            if (mapLoaded && typeof L !== 'undefined') {
                const timer = setTimeout(() => setAllReports([...allReports]), 500);
                return () => clearTimeout(timer);
            }
            return
        }

        if (!mapInstance.current) {
            mapInstance.current = L.map('map').setView([-26.2041, 28.0473], 11)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance.current)
        }

        // Fetch all reports for the map
        fetch('/api/verify/traffic')
            .then(res => res.json())
            .then(data => {
                const reports = data.reports || []
                setAllReports(reports)

                // Clear existing markers/layers from previous runs
                mapInstance.current.eachLayer((layer) => {
                    if (layer instanceof L.TileLayer) return
                    mapInstance.current.removeLayer(layer)
                })

                // Add Clustering Group
                const markers = L.markerClusterGroup({
                    showCoverageOnHover: false,
                    zoomToBoundsOnClick: true,
                    maxClusterRadius: 50
                })

                reports.forEach(r => {
                    if (r.lat && r.lng) {
                        const marker = L.marker([r.lat, r.lng])
                            .bindPopup(`
                                <div style="color: black; padding: 5px; min-width: 150px;">
                                    <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 5px; color: #1e293b;">${r.plate_number}</div>
                                    <div style="color: #3b82f6; font-weight: 700; font-size: 0.75rem; margin-bottom: 2px;">📍 ${r.province || 'South Africa'}</div>
                                    <div style="color: #f59e0b; font-weight: 600; font-size: 0.85rem; margin-bottom: 8px;">📢 ${r.offense_type}</div>
                                    <div style="font-size: 0.75rem; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 8px;">
                                        📍 ${r.location}<br/>
                                        🗓️ ${new Date(r.created_at).toLocaleDateString()}<br/>
                                        <span style="color: ${r.status === 'verified' ? '#10b981' : '#f59e0b'}; font-weight: bold;">
                                            ${r.status === 'verified' ? '✅ Verified' : '⏳ Pending'}
                                        </span>
                                    </div>
                                </div>
                            `)
                        markers.addLayer(marker)
                    }
                })

                mapInstance.current.addLayer(markers)

                if (reports.some(r => r.lat && r.lng)) {
                    mapInstance.current.fitBounds(markers.getBounds().pad(0.1))
                }
            })

    }, [mapLoaded, allReports.length])

    return null
}

function RecentReports() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

    useState(() => {
        fetch('/api/verify/traffic')
            .then(res => res.json())
            .then(data => {
                setReports(data.reports || [])
                setLoading(false)
            })
    }, [])

    if (loading) return <div className="text-center py-10 opacity-50 italic">Loading community reports...</div>
    if (reports.length === 0) return <div className="text-center py-10 opacity-50 italic">No public reports yet. Be the first!</div>

    return reports.map(r => (
        <div key={r.id} className="glass-panel hover:bg-white/5 transition-all p-5 flex justify-between items-center group">
            <div className="flex items-center gap-5">
                <div className="bg-black/60 px-4 py-3 rounded-xl font-mono font-bold text-blue-400 border border-blue-500/20 shadow-inner group-hover:border-blue-500/40 transition-colors">
                    {r.plate_number}
                </div>
                <div>
                    <div className="font-bold text-white text-lg flex items-center gap-2">
                        {r.offense_type}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="text-blue-400 font-bold">{r.province || 'SA'}</span> • <span>📍</span> {r.location} • {new Date(r.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <div className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-widest ${r.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                    {r.status === 'verified' ? 'Police Notified' : 'Pending Review'}
                </div>
                {r.status === 'pending' && (
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Approve this report for authority notification?')) return;
                            const res = await fetch('/api/verify/traffic', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: r.id, status: 'verified' })
                            });
                            if (res.ok) {
                                window.location.reload();
                            }
                        }}
                        className="text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-2 py-1 rounded transition-colors font-bold border border-emerald-500/20"
                    >
                        Approve
                    </button>
                )}
            </div>
        </div>
    ))
}
