import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, TrendingUp, Map, Award, Settings, LogOut, Wine,
  ChevronDown, Users, Eye, Star, ArrowUpRight, ArrowDownRight,
  Lock, Crown, Calendar, Clock, Filter, Download, Bell,
  MapPin, Zap, Target, PieChart, Activity, ChevronRight,
  Menu, X, ExternalLink, AlertCircle, CheckCircle,
  Pencil, Upload, Image, Plus, Trash2, Save, Globe, Phone, Dog, Tag
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import Landing from "./Landing.jsx";
import {
  auth, signInWithGoogle, signInWithEmail, logOut, onAuthChange,
  getWineryProfile, createWineryProfile, getWineryVisits, getAllVisits,
  getWineryProfileEdits, saveWineryProfileEdits, uploadWineryPhoto, validateWineryEdits,
  submitWineryClaim, getClaimStatus
} from "./firebaseClient.js";

/* ═══════════════════════════════════════════════════════════════════
   WINERY DATA — mirrors consumer app (used for benchmarking)
   ═══════════════════════════════════════════════════════════════════ */

// Default editable fields — synced from consumer app. Winery owners override these via Firestore.
const EDITABLE_DEFAULTS = {
  1: { desc: "Mountaintop estate with panoramic views. World-class Cabernet Sauvignon and Bordeaux-style blends.", hours: "Daily 10 AM – 5 PM", phone: "(805) 226-5460", website: "daouvineyards.com", dogFriendly: false, tags: ["Hilltop Views", "Cabernet", "Reserve"], experiences: [{ name: "Estate Tasting", duration: "60 min" }, { name: "Mountaintop Experience", duration: "90 min" }], gradient: "linear-gradient(135deg, #1a0533, #6b2fa0)" },
  2: { desc: "Partnership between the Perrin family of Château de Beaucastel and Robert Haas. Pioneers of Rhône varieties in Paso.", hours: "Daily 10 AM – 5 PM", phone: "(805) 237-1231", website: "tablascreek.com", dogFriendly: true, tags: ["Rhône Blends", "Organic", "Dog Friendly"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #1a3a2a, #2d6a4f)" },
  3: { desc: "High-elevation vineyards on the Santa Lucia range. Exceptional Pinot Noir, Syrah, and a legendary Viking Vineyard hike.", hours: "Daily 10 AM – 5 PM", phone: "(805) 239-8980", website: "adelaida.com", dogFriendly: true, tags: ["Mountain Estate", "Pinot Noir", "Sunset Views"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #5c3d11, #b8860b)" },
  4: { desc: "Perched on a limestone ridge with sweeping views. Known for Bordeaux varieties and a stunning hilltop tasting patio.", hours: "Daily 10 AM – 5 PM", phone: "(805) 239-0289", website: "calcareous.com", dogFriendly: true, tags: ["Hilltop", "Cabernet", "Views"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #2d1b4e, #7c3aed)" },
  19: { desc: "Iconic estate known for the legendary Isosceles blend. Beautiful gardens, on-site restaurant, and boutique hotel.", hours: "Daily 10 AM – 4:30 PM", phone: "(805) 591-3224", website: "justinwine.com", dogFriendly: true, tags: ["Isosceles", "Gardens", "Restaurant"], experiences: [{ name: "Classic Tasting", duration: "45 min" }, { name: "Vineyard Tour", duration: "75 min" }], gradient: "linear-gradient(135deg, #064e3b, #34d399)" },
  26: { desc: "Italian-inspired wines from Central Coast vineyards. Aglianico, Fiano, and Nerello Mascalese in the heart of Tin City.", hours: "Thu–Mon 11 AM – 5 PM", phone: "(805) 434-3075", website: "giornatawines.com", dogFriendly: true, tags: ["Italian Varieties", "Small Lot", "Walkable"], experiences: [{ name: "Tasting", duration: "45 min" }], gradient: "linear-gradient(135deg, #450a0a, #991b1b)" },
  32: { desc: "Named one of America's 10 Best Tasting Rooms. Unique 'Flavor Flights' pairing wines with Indian spice blends.", hours: "Daily 11 AM – 7 PM", phone: "(805) 296-1902", website: "lxvwine.com", dogFriendly: false, tags: ["Top Rated", "Spice Pairings", "Unique"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #172554, #3b82f6)" },
  70: { desc: "Wild West–themed saloon tasting room. Famous for Zinfandel and a party atmosphere.", hours: "Daily 10 AM – 5 PM", phone: "(805) 239-2204", website: "tobinjames.com", dogFriendly: true, tags: ["Fun Atmosphere", "Zinfandel", "Western Saloon"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #92400e, #d97706)" },
};

const WINERIES = [
  { id: 1, name: "DAOU Family Estates", region: "Adelaida District", rating: 4.9, reviews: 1247, price: "$$$$", ...EDITABLE_DEFAULTS[1] },
  { id: 2, name: "Tablas Creek Vineyard", region: "Adelaida District", rating: 4.8, reviews: 876, price: "$$$", ...EDITABLE_DEFAULTS[2] },
  { id: 3, name: "Adelaida Vineyards", region: "Adelaida District", rating: 4.7, reviews: 498, price: "$$$", ...EDITABLE_DEFAULTS[3] },
  { id: 4, name: "Calcareous Vineyard", region: "Adelaida District", rating: 4.7, reviews: 612, price: "$$$", ...EDITABLE_DEFAULTS[4] },
  { id: 5, name: "Halter Ranch", region: "Adelaida District", rating: 4.7, reviews: 534, price: "$$$" },
  { id: 6, name: "Law Estate Wines", region: "Adelaida District", rating: 4.8, reviews: 367, price: "$$$$" },
  { id: 7, name: "Peachy Canyon Winery", region: "Adelaida District", rating: 4.6, reviews: 723, price: "$$" },
  { id: 8, name: "Villa Creek Cellars", region: "Adelaida District", rating: 4.7, reviews: 289, price: "$$$" },
  { id: 9, name: "Chronic Cellars", region: "Adelaida District", rating: 4.5, reviews: 445, price: "$$" },
  { id: 10, name: "Carmody McKnight", region: "Adelaida District", rating: 4.6, reviews: 312, price: "$$$" },
  { id: 11, name: "Thacher Winery", region: "Adelaida District", rating: 4.7, reviews: 287, price: "$$$" },
  { id: 12, name: "Kukkula Winery", region: "Adelaida District", rating: 4.6, reviews: 198, price: "$$$" },
  { id: 13, name: "Rangeland Wines", region: "Adelaida District", rating: 4.6, reviews: 176, price: "$$$" },
  { id: 14, name: "Epoch Estate Wines", region: "Willow Creek", rating: 4.9, reviews: 542, price: "$$$$" },
  { id: 15, name: "Denner Vineyards", region: "Willow Creek", rating: 4.7, reviews: 412, price: "$$$$" },
  { id: 16, name: "Écluse Wines", region: "Willow Creek", rating: 4.6, reviews: 298, price: "$$$" },
  { id: 17, name: "Four Lanterns Winery", region: "Willow Creek", rating: 4.5, reviews: 189, price: "$$" },
  { id: 18, name: "Croad Vineyards", region: "Willow Creek", rating: 4.6, reviews: 231, price: "$$$" },
  { id: 19, name: "Justin Vineyards", region: "West Paso Robles", rating: 4.8, reviews: 983, price: "$$$", ...EDITABLE_DEFAULTS[19] },
  { id: 20, name: "Booker Vineyard", region: "West Paso Robles", rating: 4.8, reviews: 389, price: "$$$$" },
  { id: 21, name: "Austin Hope Winery", region: "Templeton Gap", rating: 4.7, reviews: 856, price: "$$$" },
  { id: 22, name: "Castoro Cellars", region: "Templeton Gap", rating: 4.5, reviews: 567, price: "$$" },
  { id: 23, name: "J Dusi Wines", region: "Templeton Gap", rating: 4.6, reviews: 345, price: "$$" },
  { id: 24, name: "Bella Luna Estate", region: "Templeton Gap", rating: 4.5, reviews: 234, price: "$$" },
  { id: 25, name: "Cass Winery", region: "Templeton Gap", rating: 4.6, reviews: 423, price: "$$$" },
  { id: 26, name: "Giornata Wines", region: "Tin City", rating: 4.8, reviews: 312, price: "$$$", ...EDITABLE_DEFAULTS[26] },
  { id: 27, name: "Sans Liege Wines", region: "Tin City", rating: 4.7, reviews: 287, price: "$$" },
  { id: 28, name: "ONX Wines", region: "Tin City", rating: 4.7, reviews: 256, price: "$$$" },
  { id: 29, name: "Turtle Rock Vineyards", region: "Tin City", rating: 4.6, reviews: 198, price: "$$" },
  { id: 30, name: "MCV Wines", region: "Tin City", rating: 4.5, reviews: 176, price: "$$" },
  { id: 31, name: "Cloak & Dagger Wines", region: "Tin City", rating: 4.6, reviews: 213, price: "$$" },
  { id: 32, name: "LXV Wine", region: "Downtown Paso Robles", rating: 4.8, reviews: 534, price: "$$$", ...EDITABLE_DEFAULTS[32] },
  { id: 33, name: "Serial Wines", region: "Downtown Paso Robles", rating: 4.7, reviews: 312, price: "$$$" },
  { id: 34, name: "Bushong Vintage Co.", region: "Downtown Paso Robles", rating: 4.6, reviews: 198, price: "$$" },
  { id: 35, name: "Tank Garage Winery", region: "Downtown Paso Robles", rating: 4.6, reviews: 267, price: "$$" },
  { id: 36, name: "Ridge Vineyards", region: "Downtown Paso Robles", rating: 4.8, reviews: 156, price: "$$$$" },
  { id: 37, name: "Villa San-Juliette", region: "Estrella District", rating: 4.6, reviews: 345, price: "$$$" },
  { id: 38, name: "Graveyard Vineyards", region: "Pleasant Valley", rating: 4.5, reviews: 198, price: "$$" },
  { id: 39, name: "Bon Niche Cellars", region: "Pleasant Valley", rating: 4.6, reviews: 123, price: "$$" },
  { id: 40, name: "Tolosa Winery", region: "Edna Valley", rating: 4.7, reviews: 534, price: "$$$" },
  { id: 41, name: "Chamisal Vineyards", region: "Edna Valley", rating: 4.7, reviews: 423, price: "$$$" },
  { id: 42, name: "Claiborne & Churchill", region: "Edna Valley", rating: 4.6, reviews: 356, price: "$$" },
  { id: 43, name: "Kynsi Winery", region: "Edna Valley", rating: 4.6, reviews: 287, price: "$$" },
  { id: 44, name: "Baileyana Winery", region: "Edna Valley", rating: 4.5, reviews: 312, price: "$$" },
  { id: 45, name: "Biddle Ranch Vineyard", region: "Edna Valley", rating: 4.5, reviews: 234, price: "$$" },
  { id: 46, name: "Wolff Vineyards", region: "Edna Valley", rating: 4.5, reviews: 198, price: "$$" },
  { id: 47, name: "Saucelito Canyon", region: "Edna Valley", rating: 4.5, reviews: 176, price: "$$" },
  { id: 48, name: "Talley Vineyards", region: "Arroyo Grande", rating: 4.8, reviews: 567, price: "$$$" },
  { id: 49, name: "Laetitia Vineyard", region: "Arroyo Grande", rating: 4.6, reviews: 423, price: "$$$" },
  { id: 50, name: "Fess Parker Winery", region: "Santa Ynez Valley", rating: 4.7, reviews: 789, price: "$$$" },
  { id: 51, name: "Stolpman Vineyards", region: "Santa Ynez Valley", rating: 4.8, reviews: 456, price: "$$$" },
  { id: 52, name: "Brander Vineyard", region: "Santa Ynez Valley", rating: 4.5, reviews: 312, price: "$$" },
  { id: 53, name: "Gainey Vineyard", region: "Santa Ynez Valley", rating: 4.5, reviews: 345, price: "$$" },
  { id: 54, name: "Sunstone Winery", region: "Santa Ynez Valley", rating: 4.6, reviews: 423, price: "$$$" },
  { id: 55, name: "Kalyra Winery", region: "Santa Ynez Valley", rating: 4.4, reviews: 267, price: "$$" },
  { id: 56, name: "Carhartt Family Wines", region: "Los Olivos", rating: 4.7, reviews: 298, price: "$$" },
  { id: 57, name: "Liquid Farm", region: "Sta. Rita Hills", rating: 4.7, reviews: 312, price: "$$$" },
  { id: 58, name: "Camins 2 Dreams", region: "Sta. Rita Hills", rating: 4.6, reviews: 189, price: "$$" },
  { id: 59, name: "Riverbench Vineyard", region: "Santa Maria Valley", rating: 4.6, reviews: 312, price: "$$" },
  { id: 60, name: "Costa de Oro Winery", region: "Santa Maria Valley", rating: 4.5, reviews: 234, price: "$$" },
  { id: 61, name: "Presqu'ile Winery", region: "Santa Maria Valley", rating: 4.8, reviews: 456, price: "$$$$" },
  { id: 62, name: "J. Lohr Vineyards", region: "Paso Robles", rating: 4.5, reviews: 678, price: "$$" },
  { id: 63, name: "Eberle Winery", region: "Paso Robles", rating: 4.6, reviews: 534, price: "$$" },
  { id: 64, name: "HammerSky Vineyards", region: "Paso Robles", rating: 4.6, reviews: 345, price: "$$$" },
  { id: 65, name: "Clavo Cellars", region: "Templeton", rating: 4.6, reviews: 312, price: "$$" },
  { id: 66, name: "TRUSS Wines", region: "Willow Creek", rating: 4.7, reviews: 89, price: "$$$" },
  { id: 67, name: "Hope Family Wines", region: "Paso Robles", rating: 4.6, reviews: 567, price: "$$" },
  { id: 68, name: "Opolo Vineyards", region: "Paso Robles", rating: 4.6, reviews: 1245, price: "$$" },
  { id: 69, name: "Vina Robles", region: "Paso Robles", rating: 4.6, reviews: 987, price: "$$" },
  { id: 70, name: "Tobin James Cellars", region: "Paso Robles", rating: 4.7, reviews: 1567, price: "$$", ...EDITABLE_DEFAULTS[70] },
  { id: 71, name: "Niner Wine Estates", region: "Paso Robles", rating: 4.7, reviews: 678, price: "$$$" },
  { id: 72, name: "L'Aventure Winery", region: "Paso Robles", rating: 4.8, reviews: 456, price: "$$$$" },
  { id: 73, name: "Linne Calodo", region: "Paso Robles", rating: 4.7, reviews: 389, price: "$$$$" },
  { id: 74, name: "Midnight Cellars", region: "Paso Robles", rating: 4.6, reviews: 423, price: "$$" },
  { id: 75, name: "Dark Star Cellars", region: "Paso Robles", rating: 4.5, reviews: 312, price: "$$" },
  { id: 76, name: "Ancient Peaks Winery", region: "Santa Margarita", rating: 4.6, reviews: 534, price: "$$" },
  { id: 77, name: "Jada Vineyard", region: "Paso Robles", rating: 4.7, reviews: 267, price: "$$$" },
  { id: 78, name: "Caliza Winery", region: "Paso Robles", rating: 4.7, reviews: 298, price: "$$$" },
  { id: 79, name: "Herman Story Wines", region: "Paso Robles", rating: 4.7, reviews: 345, price: "$$$" },
  { id: 80, name: "McPrice Myers", region: "Paso Robles", rating: 4.7, reviews: 278, price: "$$$" },
  { id: 81, name: "Shale Oak Winery", region: "Paso Robles", rating: 4.5, reviews: 234, price: "$$" },
  { id: 82, name: "Alta Colina Vineyard", region: "Paso Robles", rating: 4.7, reviews: 312, price: "$$$" },
  { id: 83, name: "Le Vigne Winery", region: "Paso Robles", rating: 4.5, reviews: 345, price: "$$" },
  { id: 84, name: "Bianchi Winery", region: "Paso Robles", rating: 4.5, reviews: 456, price: "$$" },
  { id: 85, name: "CaliPaso Winery", region: "Paso Robles", rating: 4.5, reviews: 267, price: "$$" },
  { id: 86, name: "Derby Wine Estates", region: "Paso Robles", rating: 4.6, reviews: 198, price: "$$" },
  { id: 87, name: "Victor Hugo Vineyard", region: "Paso Robles", rating: 4.5, reviews: 234, price: "$$" },
  { id: 88, name: "Wild Coyote Estate Winery", region: "Paso Robles", rating: 4.5, reviews: 189, price: "$$" },
  { id: 89, name: "Villicana Winery", region: "Paso Robles", rating: 4.6, reviews: 167, price: "$$" },
  { id: 90, name: "Parrish Family Vineyard", region: "Paso Robles", rating: 4.7, reviews: 178, price: "$$$" },
  { id: 91, name: "Whalebone Vineyard", region: "Paso Robles", rating: 4.6, reviews: 156, price: "$$" },
  { id: 92, name: "Le Cuvier Winery", region: "Paso Robles", rating: 4.6, reviews: 145, price: "$$$" },
  { id: 93, name: "Jacob Toft Wines", region: "Paso Robles", rating: 4.6, reviews: 189, price: "$$" },
  { id: 94, name: "Oso Libre Winery", region: "Paso Robles", rating: 4.6, reviews: 134, price: "$$" },
  { id: 95, name: "Firestone Vineyard", region: "Santa Ynez Valley", rating: 4.5, reviews: 876, price: "$$" },
  { id: 96, name: "Beckmen Vineyards", region: "Santa Ynez Valley", rating: 4.7, reviews: 456, price: "$$$" },
  { id: 97, name: "Zaca Mesa Winery", region: "Santa Ynez Valley", rating: 4.5, reviews: 534, price: "$$" },
  { id: 98, name: "Koehler Winery", region: "Santa Ynez Valley", rating: 4.5, reviews: 312, price: "$$" },
  { id: 99, name: "Demetria Estate", region: "Santa Ynez Valley", rating: 4.8, reviews: 267, price: "$$$$" },
  { id: 100, name: "Larner Vineyard", region: "Santa Ynez Valley", rating: 4.7, reviews: 198, price: "$$$" },
  { id: 101, name: "Star Lane Vineyard", region: "Santa Ynez Valley", rating: 4.6, reviews: 234, price: "$$$" },
  { id: 102, name: "Rusack Vineyards", region: "Santa Ynez Valley", rating: 4.6, reviews: 312, price: "$$$" },
  { id: 103, name: "Rideau Vineyard", region: "Santa Ynez Valley", rating: 4.5, reviews: 289, price: "$$" },
  { id: 104, name: "Alma Rosa Winery", region: "Sta. Rita Hills", rating: 4.6, reviews: 345, price: "$$$" },
  { id: 105, name: "Buttonwood Farm Winery", region: "Santa Ynez Valley", rating: 4.6, reviews: 198, price: "$$" },
  { id: 106, name: "Foxen Winery", region: "Santa Maria Valley", rating: 4.7, reviews: 456, price: "$$$" },
  { id: 107, name: "Rancho Sisquoc Winery", region: "Santa Maria Valley", rating: 4.5, reviews: 234, price: "$$" },
  { id: 108, name: "Sanford Winery", region: "Sta. Rita Hills", rating: 4.7, reviews: 378, price: "$$$" },
  { id: 109, name: "Babcock Winery", region: "Sta. Rita Hills", rating: 4.6, reviews: 267, price: "$$$" },
  { id: 110, name: "Grassini Family Vineyards", region: "Santa Ynez Valley", rating: 4.8, reviews: 312, price: "$$$$" },
  { id: 111, name: "Center of Effort", region: "Edna Valley", rating: 4.7, reviews: 198, price: "$$$" },
  { id: 112, name: "Sextant Wines", region: "San Luis Obispo", rating: 4.5, reviews: 234, price: "$$" },
  { id: 113, name: "Kelsey See Canyon Vineyards", region: "San Luis Obispo", rating: 4.5, reviews: 267, price: "$$" },
  { id: 114, name: "Autry Cellars", region: "Edna Valley", rating: 4.6, reviews: 156, price: "$$" },
  { id: 115, name: "Melville Winery", region: "Sta. Rita Hills", rating: 4.7, reviews: 345, price: "$$$" },
  { id: 116, name: "Foley Estates Vineyard", region: "Sta. Rita Hills", rating: 4.5, reviews: 289, price: "$$$" },
  { id: 117, name: "Brewer-Clifton", region: "Sta. Rita Hills", rating: 4.7, reviews: 312, price: "$$$$" },
  { id: 118, name: "Flying Goat Cellars", region: "Sta. Rita Hills", rating: 4.6, reviews: 178, price: "$$" },
  { id: 119, name: "Fiddlehead Cellars", region: "Sta. Rita Hills", rating: 4.6, reviews: 198, price: "$$" },
  { id: 120, name: "Palmina Wines", region: "Sta. Rita Hills", rating: 4.6, reviews: 167, price: "$$" },
  { id: 121, name: "Montemar Wines", region: "Sta. Rita Hills", rating: 4.5, reviews: 89, price: "$$" },
  { id: 122, name: "Ken Brown Wines", region: "Sta. Rita Hills", rating: 4.7, reviews: 156, price: "$$$" },
  { id: 123, name: "Bien Nacido Estate", region: "Santa Maria Valley", rating: 4.6, reviews: 234, price: "$$$" },
  { id: 124, name: "Cambria Estate Winery", region: "Santa Maria Valley", rating: 4.5, reviews: 567, price: "$$" },
  { id: 125, name: "Andrew Murray Vineyards", region: "Santa Ynez Valley", rating: 4.6, reviews: 234, price: "$$$" },
  { id: 126, name: "Byron Winery", region: "Santa Maria Valley", rating: 4.5, reviews: 345, price: "$$" },
  { id: 127, name: "Dunites Wine Co.", region: "Edna Valley", rating: 4.6, reviews: 145, price: "$$" },
];

const TRAILS = [
  { id: 1, name: "Downtown Paso Trail", stops: [32, 33, 34, 35, 36, 86] },
  { id: 2, name: "Highway 46 West Trail", stops: [71, 74, 75, 7, 67, 22] },
  { id: 3, name: "Highway 46 East Trail", stops: [69, 63, 62, 70, 84] },
  { id: 4, name: "Adelaida Back Roads", stops: [1, 4, 3, 2, 5, 11] },
  { id: 5, name: "Tin City Trail", stops: [26, 27, 28, 29, 79, 80] },
  { id: 6, name: "Dog-Friendly Trail", stops: [2, 7, 22, 19, 17, 26] },
];

/* ═══════════════════════════════════════════════════════════════════
   DEMO DATA GENERATOR — simulates realistic analytics
   ═══════════════════════════════════════════════════════════════════ */

function generateDemoData(wineryId) {
  const now = new Date();
  const daily = [];
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, visitors: 0 }));

  // Generate 90 days of realistic demo data
  for (let d = 89; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const key = date.toISOString().split("T")[0];
    const dow = date.getDay();

    // Simulate realistic traffic patterns
    const baseVisitors = Math.floor(Math.random() * 150) + 50;
    const weekendBoost = [0, 6].includes(dow) ? 1.3 : 0.9;
    const visitors = Math.floor(baseVisitors * weekendBoost);
    const checkIns = Math.floor(visitors * 0.45 + Math.random() * 20);

    daily.push({
      date: key,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      visitors,
      checkIns,
      avgRating: 4 + Math.random() * 1,
    });
  }

  // Hourly distribution (peak during 12-6pm)
  for (let h = 0; h < 24; h++) {
    if (h >= 11 && h <= 18) {
      hourly[h].visitors = Math.floor(Math.random() * 40) + 30;
    } else if (h >= 9 && h <= 21) {
      hourly[h].visitors = Math.floor(Math.random() * 20) + 10;
    } else {
      hourly[h].visitors = Math.floor(Math.random() * 5);
    }
  }

  // Traffic sources
  const sourceColors = { "Sip805 App": "#9333ea", "Google Maps": "#3b82f6", "Direct / Walk-in": "#16a34a", "Trail Route": "#f59e0b", "Social Media": "#ef4444" };
  const sources = [
    { name: "Sip805 App", value: 800 + Math.floor(Math.random() * 400), color: sourceColors["Sip805 App"] },
    { name: "Google Maps", value: 450 + Math.floor(Math.random() * 300), color: sourceColors["Google Maps"] },
    { name: "Direct / Walk-in", value: 320 + Math.floor(Math.random() * 250), color: sourceColors["Direct / Walk-in"] },
    { name: "Trail Route", value: 150 + Math.floor(Math.random() * 150), color: sourceColors["Trail Route"] },
    { name: "Social Media", value: 120 + Math.floor(Math.random() * 100), color: sourceColors["Social Media"] },
  ];

  // Rating distribution
  const ratingColors = { 5: "#16a34a", 4: "#84cc16", 3: "#f59e0b", 2: "#f97316", 1: "#ef4444" };
  const ratings = [
    { stars: "5 stars", count: 380 + Math.floor(Math.random() * 150), color: ratingColors[5] },
    { stars: "4 stars", count: 250 + Math.floor(Math.random() * 100), color: ratingColors[4] },
    { stars: "3 stars", count: 90 + Math.floor(Math.random() * 50), color: ratingColors[3] },
    { stars: "2 stars", count: 20 + Math.floor(Math.random() * 30), color: ratingColors[2] },
    { stars: "1 star", count: 10 + Math.floor(Math.random() * 15), color: ratingColors[1] },
  ];

  const last30 = daily.slice(-30);
  const prev30 = daily.slice(-60, -30);
  const totalVisitors30 = last30.reduce((s, d) => s + d.visitors, 0);
  const totalVisitorsPrev = prev30.reduce((s, d) => s + d.visitors, 0);
  const totalCheckIns30 = last30.reduce((s, d) => s + d.checkIns, 0);
  const totalCheckInsPrev = prev30.reduce((s, d) => s + d.checkIns, 0);
  const ratedDays = last30.filter(d => d.avgRating > 0);
  const avgRating30 = ratedDays.length > 0 ? +(ratedDays.reduce((s, d) => s + d.avgRating, 0) / ratedDays.length).toFixed(1) : 0;

  return {
    daily, hourly, sources, ratings,
    kpi: {
      visitors: { value: totalVisitors30, change: totalVisitorsPrev ? +((totalVisitors30 - totalVisitorsPrev) / totalVisitorsPrev * 100).toFixed(1) : 0 },
      checkIns: { value: totalCheckIns30, change: totalCheckInsPrev ? +((totalCheckIns30 - totalCheckInsPrev) / totalCheckInsPrev * 100).toFixed(1) : 0 },
      avgRating: { value: avgRating30, change: 0 },
      trailAppearances: { value: TRAILS.filter(t => t.stops.includes(wineryId)).length, change: 0 },
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

// ── KPI Card ────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, change, prefix = "", suffix = "", color = "purple" }) => {
  const up = change > 0;
  const colorMap = { purple: "bg-purple-50 text-purple-600", blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", amber: "bg-amber-50 text-amber-600" };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== 0 && change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
            {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
};

// ── Premium Lock Overlay ────────────────────────────────────────
const PremiumLock = ({ feature }) => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
      <Lock className="w-6 h-6 text-purple-600" />
    </div>
    <p className="text-sm font-semibold text-gray-900 mb-1">Premium Feature</p>
    <p className="text-xs text-gray-400 mb-3 text-center px-4">{feature}</p>
    <button className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition flex items-center gap-1.5">
      <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
    </button>
  </div>
);

// ── Section Header ──────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   PAGES
   ═══════════════════════════════════════════════════════════════════ */

// ── OVERVIEW PAGE ───────────────────────────────────────────────
const OverviewPage = ({ data, winery, tier }) => {
  const [range, setRange] = useState("30d");
  const chartData = range === "7d" ? data.daily.slice(-7) : range === "30d" ? data.daily.slice(-30) : data.daily;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-400 mt-1">Welcome back, {winery.name}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {["7d", "30d", "90d"].map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${range === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Eye} label="App Views (30d)" value={data.kpi.visitors.value} change={data.kpi.visitors.change} color="purple" />
        <KpiCard icon={CheckCircle} label="Check-ins (30d)" value={data.kpi.checkIns.value} change={data.kpi.checkIns.change} color="blue" />
        <KpiCard icon={Star} label="Avg Rating" value={data.kpi.avgRating.value} change={data.kpi.avgRating.change} color="amber" />
        <KpiCard icon={Map} label="Trail Appearances" value={data.kpi.trailAppearances.value} color="green" />
      </div>

      {/* Visitors Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title="Visitor Traffic" subtitle={`Daily app views & check-ins — last ${range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"}`} />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
              <Area type="monotone" dataKey="visitors" stroke="#9333ea" strokeWidth={2} fill="url(#gPurple)" name="App Views" />
              <Area type="monotone" dataKey="checkIns" stroke="#3b82f6" strokeWidth={2} fill="url(#gBlue)" name="Check-ins" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column: Sources + Hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <SectionHeader title="Traffic Sources" subtitle="Where your visitors come from" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={data.sources} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {data.sources.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 relative">
          <SectionHeader title="Peak Hours" subtitle="Today's visitor distribution by hour" />
          {tier === "free" && <PremiumLock feature="See your busiest hours to optimize staffing" />}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly.slice(8, 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="visitors" fill="#9333ea" radius={[4, 4, 0, 0]} name="Visitors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TRAFFIC PAGE ────────────────────────────────────────────────
const TrafficPage = ({ data, winery, tier }) => {
  const weekdayData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = days.map(d => ({ day: d, visitors: 0, count: 0 }));
    data.daily.forEach(d => {
      const dow = new Date(d.date).getDay();
      buckets[dow].visitors += d.visitors;
      buckets[dow].count++;
    });
    return buckets.map(b => ({ ...b, avg: b.count ? Math.round(b.visitors / b.count) : 0 }));
  }, [data.daily]);

  const checkInRate = data.kpi.visitors.value > 0
    ? ((data.kpi.checkIns.value / data.kpi.visitors.value) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Traffic Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Deep dive into your visitor patterns</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Eye} label="Total App Views (30d)" value={data.kpi.visitors.value} change={data.kpi.visitors.change} color="purple" />
        <KpiCard icon={CheckCircle} label="Check-in Rate" value={checkInRate} suffix="%" color="blue" />
        <KpiCard icon={Users} label="Unique Visitors (est.)" value={Math.round(data.kpi.visitors.value * 0.72)} color="green" />
      </div>

      {/* Day of Week */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title="Visitors by Day of Week" subtitle="Average daily traffic across the week" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="avg" fill="#9333ea" radius={[6, 6, 0, 0]} name="Avg Visitors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ratings Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title="Rating Breakdown" subtitle="Distribution of check-in ratings" />
        <div className="space-y-3 mt-2">
          {data.ratings.map(r => {
            const total = data.ratings.reduce((s, x) => s + x.count, 0);
            const pct = ((r.count / total) * 100).toFixed(0);
            return (
              <div key={r.stars} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14">{r.stars}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: r.color }} />
                </div>
                <span className="text-xs font-medium text-gray-600 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── TRAILS PAGE ─────────────────────────────────────────────────
const TrailsPage = ({ data, winery, tier }) => {
  const wineryTrails = TRAILS.filter(t => t.stops.includes(winery.id));
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Trail Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Featured wine trails and experiences</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard icon={Map} label="Trail Appearances" value={wineryTrails.length} color="green" />
        <KpiCard icon={Users} label="Trail-generated Visits (est.)" value={Math.floor(data.kpi.visitors.value * 0.15)} color="blue" />
        <KpiCard icon={TrendingUp} label="Trail Conversion Rate" value="12.5" suffix="%" color="purple" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title="Your Trails" subtitle="Wine trails featuring your winery" />
        <div className="space-y-3">
          {wineryTrails.length > 0 ? wineryTrails.map(trail => (
            <div key={trail.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">{trail.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{trail.stops.length} stops</div>
              </div>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1">View <ChevronRight className="w-4 h-4" /></button>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Not featured on any trails yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── BENCHMARK PAGE ──────────────────────────────────────────────
const BenchmarkPage = ({ data, winery, tier }) => {
  const wineryRegion = WINERIES.filter(w => w.region === winery.region);
  const avgRegionVisitors = Math.round(wineryRegion.reduce((s, w) => s + 1200, 0) / wineryRegion.length);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Benchmark</h2>
        <p className="text-sm text-gray-400 mt-1">How you compare to other {winery.region} wineries</p>
      </div>
      {tier === "free" && (
        <div className="relative bg-white rounded-2xl border border-gray-100 p-8">
          <PremiumLock feature="Compare your performance against similar wineries in your region" />
          <div className="space-y-4 opacity-50">
            <KpiCard icon={TrendingUp} label="vs Regional Average" value="+18.5" suffix="%" color="green" />
            <KpiCard icon={Star} label="Rating vs Peers" value="4.8" color="amber" />
          </div>
        </div>
      )}
      {tier === "pro" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard icon={TrendingUp} label="vs Regional Average" value="+18.5" suffix="%" color="green" />
          <KpiCard icon={Star} label="Rating vs Peers" value="4.8" color="amber" />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title={`${winery.region} Region Stats`} subtitle={`${wineryRegion.length} wineries`} />
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Regional Avg Visitors</span>
            <span className="font-semibold text-gray-900">{avgRegionVisitors.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Your Visitors (30d)</span>
            <span className="font-semibold text-gray-900">{data.kpi.visitors.value.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Your Performance</span>
            <span className="font-bold text-green-600">+{Math.round((data.kpi.visitors.value / avgRegionVisitors - 1) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── PROFILE EDITOR PAGE ─────────────────────────────────────────
const ProfileEditorPage = ({ winery, user, tier }) => {
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const defaults = EDITABLE_DEFAULTS[winery.id] || {};
  const display = { ...defaults, ...edits };

  const handleChange = (field, value) => {
    setEdits(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveWineryProfileEdits(winery.id, edits, user.uid);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setEdits({});
      }
    } catch (e) {
      alert("Error saving: " + e.message);
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadWineryPhoto(winery.id, file);
      if (result.success) {
        alert("Photo uploaded!");
      } else {
        alert("Error: " + result.error);
      }
    } catch (e) {
      alert("Upload failed: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <p className="text-sm text-gray-400 mt-1">Customize your winery listing on Sip805</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-4 h-4" /> Changes saved!
        </div>
      )}

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <label className="text-sm font-semibold text-gray-900 block mb-2">Description (20-500 chars)</label>
        <textarea value={display.desc || ""} onChange={e => handleChange("desc", e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none resize-none" />
        <div className="text-xs text-gray-400 mt-1">{(display.desc || "").length} characters</div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
            <input type="text" value={display.phone || ""} onChange={e => handleChange("phone", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="(XXX) XXX-XXXX" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Website</label>
            <input type="text" value={display.website || ""} onChange={e => handleChange("website", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="yourwinery.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Hours</label>
            <input type="text" value={display.hours || ""} onChange={e => handleChange("hours", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="Daily 10 AM - 5 PM" />
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Attributes</h3>
        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${display.dogFriendly ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`} onClick={() => handleChange("dogFriendly", !display.dogFriendly)}>
            <Dog className="w-4 h-4" /> Dog Friendly
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags (up to 3)</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(display.tags || []).map((tag, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
              {tag} <button onClick={() => handleChange("tags", display.tags.filter((_, j) => j !== i))} className="hover:text-purple-900"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={saving || Object.keys(edits).length === 0} className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

// ── SETTINGS PAGE ───────────────────────────────────────────────
const SettingsPage = ({ winery, tier, onLogout }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      <p className="text-sm text-gray-400 mt-1">Manage your winery dashboard</p>
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Winery Profile</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Winery Name</label>
          <div className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">{winery.name}</div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Region</label>
          <div className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">{winery.region}</div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Price Tier</label>
          <div className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">{winery.price}</div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Dashboard Plan</label>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium px-3 py-2.5 rounded-lg ${tier === "pro" ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-700"}`}>
              {tier === "pro" ? "Pro" : "Free"}
            </span>
            {tier === "free" && (
              <button className="text-xs text-purple-600 font-medium hover:underline flex items-center gap-1">
                <Crown className="w-3 h-3" /> Upgrade
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Premium Plans */}
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Plans & Pricing</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`border-2 rounded-xl p-5 ${tier === "free" ? "border-gray-200" : "border-gray-100"}`}>
          <div className="text-sm font-bold text-gray-900">Free</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">$0<span className="text-sm text-gray-400 font-normal">/mo</span></div>
          <ul className="mt-3 space-y-2 text-xs text-gray-500">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Overview dashboard</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Basic traffic stats</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Trail appearances</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Region leaderboard</li>
          </ul>
        </div>
        <div className={`border-2 rounded-xl p-5 relative ${tier === "pro" ? "border-purple-400 bg-purple-50/30" : "border-purple-200"}`}>
          <div className="absolute -top-2.5 right-4 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">RECOMMENDED</div>
          <div className="text-sm font-bold text-purple-700">Pro</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">$49<span className="text-sm text-gray-400 font-normal">/mo</span></div>
          <ul className="mt-3 space-y-2 text-xs text-gray-500">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Everything in Free</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Peak hours analysis</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Conversion funnel</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Competitor comparison</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Trail deep analytics</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> CSV data export</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Featured placement boost</li>
          </ul>
          {tier === "free" && (
            <button className="w-full mt-4 bg-purple-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-purple-700 transition">
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </div>

    <button onClick={onLogout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium">
      <LogOut className="w-4 h-4" /> Sign Out
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════════════════════════════ */

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "")?.replace("Error (", "")?.replace(").", "") || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Wine className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white tracking-tight">Sip805</span>
          </div>
          <h1 className="text-xl font-bold text-white">Winery Dashboard</h1>
          <p className="text-purple-200 text-sm mt-1">Analytics for Central Coast wineries</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="you@winery.com" required />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="Min 6 characters" required />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
              {loading ? "Please wait..." : "Sign In"}
            </button>

            <p className="text-center text-xs text-gray-400">New account? Just enter your email and password — we'll create it automatically.</p>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
          </div>

          <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.42l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PENDING CLAIM SCREEN
   ═══════════════════════════════════════════════════════════════════ */

const PendingClaimScreen = ({ wineryName, onLogout }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Claim Under Review</h2>
      <p className="text-sm text-gray-600 mt-4 leading-relaxed">
        Your claim for <span className="font-semibold">{wineryName}</span> has been submitted and is being reviewed.
      </p>
      <p className="text-xs text-gray-400 mt-2">You'll get access once approved.</p>
      <p className="text-xs text-gray-400 mt-4">This usually takes less than 24 hours.</p>
      <button onClick={onLogout} className="w-full mt-6 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition">
        Sign Out
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   WINERY SELECTOR (post-login, if no winery profile yet)
   ═══════════════════════════════════════════════════════════════════ */

const WinerySelector = ({ user, onSelect }) => {
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const filtered = WINERIES.filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.region.toLowerCase().includes(search.toLowerCase()));

  const handleClaim = (w) => {
    setSelectedClaim(w);
  };

  const handleSubmitClaim = async () => {
    if (!selectedClaim) return;
    try {
      await submitWineryClaim(user.uid, user.email, selectedClaim.id, selectedClaim.name);
      setSubmitted(true);
    } catch (e) {
      alert("Error submitting claim: " + e.message);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Claim Submitted!</h2>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Your claim for <span className="font-semibold text-gray-700">{selectedClaim.name}</span> has been submitted for review. You'll get access once approved.
          </p>
          <p className="text-xs text-gray-400 mt-4">This usually takes less than 24 hours.</p>
        </div>
      </div>
    );
  }

  if (selectedClaim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: selectedClaim.gradient || "linear-gradient(135deg, #1a0533, #6b2fa0)" }}>
              <Wine className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Claim {selectedClaim.name}?</h2>
            <p className="text-sm text-gray-400 mt-1">{selectedClaim.region} · {selectedClaim.price}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              By claiming this winery, you're confirming you own or manage <span className="font-semibold">{selectedClaim.name}</span>. Your request will be reviewed before access is granted.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSelectedClaim(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">Back</button>
            <button onClick={handleSubmitClaim} className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition">Submit Claim</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <Wine className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-gray-900">Claim Your Winery</h2>
          <p className="text-sm text-gray-400 mt-1">Select the winery you own or manage</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none mb-4"
          placeholder="Search wineries..."
        />
        <div className="max-h-80 overflow-y-auto space-y-1">
          {filtered.map(w => (
            <button key={w.id} onClick={() => handleClaim(w)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-left transition">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Wine className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{w.name}</div>
                <div className="text-xs text-gray-400">{w.region} · {w.price}</div>
              </div>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm text-gray-600">{w.rating}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════ */

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [winery, setWinery] = useState(null);
  const [claimStatus, setClaimStatus] = useState(null); // null | "pending" | "none"
  const [claimWineryName, setClaimWineryName] = useState("");
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const tier = "free"; // TODO: read from Firestore profile

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        setShowDashboard(true);
        // Check if they have an approved winery profile
        const profile = await getWineryProfile(u.uid);
        if (profile?.wineryId) {
          const w = WINERIES.find(x => x.id === profile.wineryId);
          if (w) setWinery(w);
        } else {
          // Check for pending claim
          const claimDoc = await getClaimStatus(u.uid);
          if (claimDoc && claimDoc.status === "pending") {
            setClaimStatus("pending");
            setClaimWineryName(claimDoc.wineryName || "");
          } else {
            setClaimStatus("none");
          }
        }
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleSelectWinery = async (w) => {
    setWinery(w);
    setPage("overview");
  };

  const handleLogout = async () => {
    await logOut();
    setUser(null);
    setWinery(null);
    setClaimStatus(null);
    setPage("overview");
    setShowDashboard(false);
  };

  // Generate demo data for the winery
  const data = useMemo(() => winery ? generateDemoData(winery.id) : null, [winery?.id]);

  // Nav items for winery dashboard
  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "traffic", label: "Traffic", icon: Activity },
    { id: "trails", label: "Trails", icon: Map },
    { id: "benchmark", label: "Benchmark", icon: Award },
    { id: "profile", label: "Edit Profile", icon: Pencil },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show landing page by default; dashboard only after clicking "Get Started" or if already authenticated
  if (!showDashboard && !user) return <Landing onEnterDashboard={() => setShowDashboard(true)} />;

  if (!user) return <LoginScreen />;
  if (!winery && claimStatus === "pending") return <PendingClaimScreen wineryName={claimWineryName} onLogout={handleLogout} />;
  if (!winery) return <WinerySelector user={user} onSelect={handleSelectWinery} />;

  // Full dashboard (locked to their winery)
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wine className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">Sip805</span>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <p className="text-[10px] text-purple-500 font-semibold tracking-wider mt-0.5">WINERY DASHBOARD</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${page === item.id ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
              {winery.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{winery.name}</div>
              <div className="text-[10px] text-gray-400">{tier === "pro" ? "Pro Plan" : "Free Plan"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            {/* Static winery display */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{winery.name}</span>
              <span className="text-xs text-gray-400">· {winery.region}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {tier === "free" && (
              <button className="hidden sm:flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-purple-700 transition">
                <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
              </button>
            )}
            <button className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
              <Bell className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 max-w-6xl mx-auto">
          {page === "overview" && <OverviewPage data={data} winery={winery} tier={tier} />}
          {page === "traffic" && <TrafficPage data={data} winery={winery} tier={tier} />}
          {page === "trails" && <TrailsPage data={data} winery={winery} tier={tier} />}
          {page === "benchmark" && <BenchmarkPage data={data} winery={winery} tier={tier} />}
          {page === "profile" && <ProfileEditorPage winery={winery} user={user} tier={tier} />}
          {page === "settings" && <SettingsPage winery={winery} tier={tier} onLogout={handleLogout} />}
        </div>
      </main>
    </div>
  );
}
