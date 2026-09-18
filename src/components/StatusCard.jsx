import "../styles/dashboard.css";

function StatusCard({ title, value, color }) {

    return (

        <div className="status-card">

            <h4>{title}</h4>

            <h2 style={{ color }}>

                {value}

            </h2>

        </div>

    );

}

export default StatusCard;