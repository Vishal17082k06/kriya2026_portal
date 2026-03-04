import { useNavigate } from "react-router-dom";
import "./ShipLanding.css";

const ships = [
  {
    id: "warship",
    name: "Grand Bernacle",
    subtitle: "Where cannons roar, legends are born",
    img: "/GrandBernacle.png",
  },
  {
    id: "merchant",
    name: "Merchant Vessel",
    subtitle: "Fortune favors those who dare.",
    img: "/merchantvessel.png",
  },
  {
    id: "ghost",
    name: "Black Pearl",
    subtitle: "Born of shadow. Feared by all",
    img: "/blackpearlGhostship.png",
  },
];

export default function ShipLanding() {
  const navigate = useNavigate();

  const handleSelect = (ship) => {
    navigate("/anchorage", { state: { ship } });
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