import "../styles/ota-portal.css";

export default function OTAPortal() {
    const OTA_URL = "http://192.168.0.101/update";

    const openOTAPortal = () => {
        window.open(OTA_URL, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="ota-page">
            <div className="ota-card">
                
                {/* =================================================
                    ICON EXTERNAL LINK
                ================================================= */}
                <div className="ota-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 5H19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 5L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 14V18C19 18.5523 18.5523 19 18 19H6C5.44772 19 5 18.5523 5 18V6C5 5.44772 5.44772 5 6 5H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* =================================================
                    TITLE
                ================================================= */}
                <h1>External OTA Portal</h1>

                {/* =================================================
                    DESCRIPTION
                ================================================= */}
                <p className="ota-description">
                    System firmware updates and fleet-wide deployments are now managed through our dedicated secure portal. Please proceed to the external interface to manage updates.
                </p>

                {/* =================================================
                    BUTTON
                ================================================= */}
                <button className="ota-button" onClick={openOTAPortal}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 5H19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 5L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 14V18C19 18.5523 18.5523 19 18 19H6C5.44772 19 5 18.5523 5 18V6C5 5.44772 5.44772 5 6 5H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>OPEN OTA PORTAL</span>
                </button>

                {/* =================================================
                    ADDRESS
                ================================================= */}
                <div className="ota-address">
                    <span className="ota-lock">🔒</span>
                    <span>SECURE ENDPOINT:</span>
                    <strong>192.168.0.101/update</strong>
                </div>

            </div>
        </div>
    );
}