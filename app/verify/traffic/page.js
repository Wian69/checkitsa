import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'

export default function TrafficReporter() {
    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [offense, setOffense] = useState('Reckless Driving')
    const [location, setLocation] = useState('')
    const [coords, setCoords] = useState(null)
    const [description, setDescription] = useState('')
    const [mapLoaded, setMapLoaded] = useState(false)
    const fileInputRef = useRef(null)
    const mapRef = useRef(null)

    const getGeolocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser")
            return
        }
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords
            setCoords({ lat: latitude, lng: longitude })
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }, () => {
            alert("Unable to retrieve your location")
        })
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
            setResult(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const openWhatsApp = () => {
        const msg = `🚔 *ROAD SENTINEL REPORT*\n\nVehicle: ${result?.plate}\nOffense: ${offense}\nLocation: ${location}\nDetails: ${description}\n\nPhoto evidence attached in report ID: ${result?.success}.`
        window.open(`https://wa.me/27814106338?text=${encodeURIComponent(msg)}`, '_blank')
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
            <div className="max-w-2xl mx-auto pt-10">
                <Link href="/dashboard" className="text-blue-400 mb-8 inline-block">← Back to Dashboard</Link>

                <div style={{
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
                    padding: '2rem',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                    marginBottom: '2rem'
                }}>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <span className="text-4xl">🚦</span> Road Sentinel
                    </h1>
                    <p className="text-slate-400 mb-6 font-medium">AI-Powered Traffic Incident Reporter</p>

                    {!result ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-orange-500/30 rounded-2xl p-8 text-center cursor-pointer hover:bg-orange-500/5 transition-all"
                            >
                                {image ? (
                                    <img src={image} alt="Preview" className="max-h-64 mx-auto rounded-lg mb-4" />
                                ) : (
                                    <div className="py-10">
                                        <div className="text-5xl mb-4">📸</div>
                                        <div className="text-lg font-bold">Snap or Upload a Photo</div>
                                        <div className="text-sm text-slate-500">Make sure the number plate is clear</div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-300">Offense Type</label>
                                    <select
                                        value={offense}
                                        onChange={(e) => setOffense(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                                    >
                                        <option>Reckless Driving</option>
                                        <option>Speeding</option>
                                        <option>Skipped Red Light</option>
                                        <option>Illegal Overtaking</option>
                                        <option>Unroadworthy Vehicle</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-300 flex justify-between">
                                        <span>Exact Location</span>
                                        <button
                                            type="button"
                                            onClick={getGeolocation}
                                            className="text-xs text-orange-400 hover:text-orange-300"
                                        >
                                            📍 Use My Location
                                        </button>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. N1 South, William Nicol Offramp"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-slate-300">Short Description</label>
                                <textarea
                                    rows="3"
                                    placeholder="Describe what happened..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !image}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${loading || !image
                                    ? 'bg-slate-800 text-slate-500'
                                    : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02]'
                                    }`}
                            >
                                {loading ? '🤖 AI Extracting Plate...' : '🚀 Submit Report'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                                <div className="text-5xl mb-4">✅</div>
                                <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
                                <p className="text-slate-400">AI identified vehicle plate:</p>
                                <div className="text-4xl font-mono font-bold text-white mt-2 p-4 bg-black/30 rounded-xl inline-block">
                                    {result.plate}
                                </div>
                                <p className="mt-4 text-sm text-slate-500">
                                    Vehicle: {result.details?.vehicle_description || 'Unidentified'} • {result.details?.province || 'South Africa'}
                                </p>
                            </div>

                            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <span>📩</span> Next Steps
                                </h3>
                                <div className="space-y-4">
                                    <button
                                        onClick={openWhatsApp}
                                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold hover:opacity-90"
                                    >
                                        <span>💬</span> Report to JMPD WhatsApp
                                    </button>
                                    <div className="text-xs text-center text-slate-500 px-4">
                                        We have also added this to the CheckItSA database and will notify the RTCC (National Traffic Call Centre) automatically.
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setResult(null)}
                                className="w-full py-3 text-slate-400 hover:text-white transition-colors"
                            >
                                Submit another report
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-sm text-slate-500 bg-slate-900/30 p-4 rounded-xl border border-slate-800 mb-8">
                    <strong>Legal Notice:</strong> Knowingly submitting false reports to traffic authorities is a criminal offense. Use this tool responsibly to improve South African road safety.
                </div>

                {/* Map View Intelligence */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <span>🌍</span> Incident Map Intelligence
                    </h2>
                    <div className="glass-panel overflow-hidden border border-slate-800" style={{ height: '400px', borderRadius: '1.5rem', position: 'relative' }}>
                        <div id="map" style={{ height: '100%', width: '100%', background: '#020617' }}></div>
                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-[1000] text-slate-500 italic">
                                Loading interactive map...
                            </div>
                        )}
                    </div>
                </div>

                {/* Wall of Shame Feed */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span>📢</span> Community Wall of Shame
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
        </div>
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
                                    <div style="color: #f59e0b; font-weight: 600; font-size: 0.85rem; margin-bottom: 8px;">📢 ${r.offense_type}</div>
                                    <div style="font-size: 0.75rem; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 8px;">
                                        📍 ${r.location}<br/>
                                        🗓️ ${new Date(r.created_at).toLocaleDateString()}
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
        <div key={r.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center hover:bg-slate-900 transition-colors">
            <div className="flex items-center gap-4">
                <div className="bg-black/40 px-3 py-2 rounded-lg font-mono font-bold text-orange-400 border border-orange-500/20">
                    {r.plate_number}
                </div>
                <div>
                    <div className="font-bold">{r.offense_type}</div>
                    <div className="text-xs text-slate-500">{r.location} • {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
            </div>
            <div className={`text-xs px-2 py-1 rounded ${r.status === 'verified' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {r.status === 'verified' ? 'Police Notified' : 'Under Review'}
            </div>
        </div>
    ))
}
