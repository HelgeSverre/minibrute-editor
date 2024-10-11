import Alpine from "alpinejs";
import "./style.css";
import app from "./app";

window.Alpine = Alpine;

Alpine.data("app", app);
Alpine.start();
