// Self-hosted fonts (Fontsource, font-display: swap). Same families and
// weights as the previous Google Fonts import, so the certificate artifact
// and marketing type render identically without a render-blocking request.
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/dancing-script/500.css";
import "@fontsource/dancing-script/600.css";
import "@fontsource/dancing-script/700.css";
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
