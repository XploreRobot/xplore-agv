import Layout from "../components/Layout";
import LiveMap from "../components/LiveMap";
import StatusCard from "../components/StatusCard";

import "../styles/dashboard.css";

function Dashboard() {

    return (

        <Layout>

            <div className="dashboard-container">

                <LiveMap />

                <div className="card-container">

                    

                </div>

            </div>

        </Layout>

    );

}

export default Dashboard;