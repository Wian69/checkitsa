import Link from 'next/link'
import Image from 'next/image'

export default function AdBanner({ format = 'rectangle', className = '' }) {
    const affiliateLink = "https://hollywoodbetsaffs.click/o/hP6iNE?lpage=wkMWJB&site_id=100761"

    // Asset Mapping based on format
    const assets = {
        'rectangle': {
            src: "/Pragmatic-Play-Prize-Drops-National-Campaign/HWPS0613_Pragmatic-Play-Prize-Drops-National-Campaign-Dec-Jan-26---Phase-2---AFFILIATE---300x250.gif",
            width: 300,
            height: 250,
            alt: "Hollywood Bets - Win Big with Pragmatic Play"
        },
        'leaderboard': {
            src: "/Pragmatic-Play-Prize-Drops-National-Campaign/HWPS0613_Pragmatic-Play-Prize-Drops-National-Campaign-Dec-Jan-26---Phase-2---AFFILIATE---728X90.gif",
            width: 728,
            height: 90,
            alt: "Hollywood Bets - Join the Action"
        },
        'skyscraper': {
            src: "/Pragmatic-Play-Prize-Drops-National-Campaign/HWPS0613_Pragmatic-Play-Prize-Drops-National-Campaign-Dec-Jan-26---Phase-2---AFFILIATE---160x600.gif",
            width: 160,
            height: 600,
            alt: "Hollywood Bets - Sign Up Now"
        }
    }

    const ad = assets[format] || assets['rectangle']

    return (
        <div className={`ad-container ${className}`} style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <a
                href={affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'block',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transition: 'transform 0.2s ease-in-out'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <Image
                    src={ad.src}
                    width={ad.width}
                    height={ad.height}
                    alt={ad.alt}
                    unoptimized={true} // Required for animated GIFs usually, asking Next.js to skip optimization
                />
            </a>
        </div>
    )
}
