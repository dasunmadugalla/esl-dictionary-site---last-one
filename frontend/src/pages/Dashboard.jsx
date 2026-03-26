import React from "react";
import { TbSearch } from "react-icons/tb";
function Dashboard() {
  return (
    <div className="dashboard-main-container">
      <div className="dsh-brd-top-row">
        <div className="dsh-brb-top-row-miniBox">
          <TbSearch />
          <h2 className="metric">342</h2>
          <p>words looked up</p>
          <p>
            <span>+23</span> this week
          </p>
        </div>

        {/* delete this stuff down there */}
        <div className="dsh-brb-top-row-miniBox">
          <TbSearch />
          <h2 className="metric">342</h2>
          <p>words looked up</p>
          <p>
            <span>+23</span> this week
          </p>
        </div>
        <div className="dsh-brb-top-row-miniBox">
          <TbSearch />
          <h2 className="metric">342</h2>
          <p>words looked up</p>
          <p>
            <span>+23</span> this week
          </p>
        </div>
        <div className="dsh-brb-top-row-miniBox">
          <TbSearch />
          <h2 className="metric">342</h2>
          <p>words looked up</p>
          <p>
            <span>+23</span> this week
          </p>
        </div>

        {/* till here */}
      </div>
      <div className="dsh-brd-scnd-row">
        <div className="streak-card">
          <input type="range" min="0" max="100" defaultValue="50"  className="streak-ratio" />
        </div>
      </div>
    </div>
  );  
}

export default Dashboard;
