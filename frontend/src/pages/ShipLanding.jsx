import { useNavigate } from "react-router-dom";
import "./ShipLanding.css";
import { API_BASE } from "../config/api";

const ships = [
  {
    id: "WARSHIP",
    name: "Grand Bernacle",
    subtitle: "Where cannons roar, legends are born",
    img: "/GrandBernacle.png",
  },
  {
    id: "MERCHANT",
    name: "Merchant Vessel",
    subtitle: "Fortune favors those who dare.",
    img: "/merchantvessel.png",
  },
  {
    id: "GHOST",
    name: "Black Pearl",
    subtitle: "Born of shadow. Feared by all",
    img: "/blackpearlGhostship.png",
  },
];

export default function ShipLanding() {
  const navigate = useNavigate();

  const handleSelect = async (ship) => {
    try {

      const team = JSON.parse(localStorage.getItem("team"));

      const res = await fetch(
        `${API_BASE}/api/teams/select-ship`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            kriyaID: team.kriyaID,
            shipConfig: ship.id
          })
        }
      );

      const data = await res.json();

      if (data.success) {
        navigate("/anchorage", { state: { ship } });
      }

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="landing-container">
      <h1 className="landing-title">Choose Your Ship</h1>

      <div className="ships-wrapper">
        {ships.map((ship) => (
          <div
            key={ship.id}
            className="ship-panel"
            onClick={() => handleSelect(ship)}
          >
            <img src={ship.img} alt={ship.name} className="ship-image" />

            <div className="panel-overlay">
              <h2>{ship.name}</h2>
              <p>{ship.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="bottom-quote">
        Not all who sail return… but all are remembered.
      </p>
    </div>
  );
}