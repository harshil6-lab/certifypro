// Dynamically sets the app favicon and initializes the React root to render the main App component.
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import certifyProIcon from "@/assets/certify_pro_icon.png";

const favicon = document.querySelector("link[rel='icon']") ?? document.createElement("link");
favicon.setAttribute("rel", "icon");
favicon.setAttribute("type", "image/png");
favicon.setAttribute("href", certifyProIcon);

if (!favicon.parentNode) {
	document.head.appendChild(favicon);
}

createRoot(document.getElementById("root")!).render(<App />);
