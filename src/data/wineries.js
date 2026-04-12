// ══════════════════════════════════════════════════════════════
// Shared winery data — used by dashboard pages & claim selector
// Mirrors consumer app. Single source of truth for this app.
// ══════════════════════════════════════════════════════════════

export const WINERIES = [
  { id: 1, name: "DAOU Family Estates", region: "Adelaida District", rating: 4.9, reviews: 1247, price: "$$$$" },
  { id: 2, name: "Tablas Creek Vineyard", region: "Adelaida District", rating: 4.8, reviews: 876, price: "$$$" },
  { id: 3, name: "Adelaida Vineyards", region: "Adelaida District", rating: 4.7, reviews: 498, price: "$$$" },
  { id: 4, name: "Calcareous Vineyard", region: "Adelaida District", rating: 4.7, reviews: 612, price: "$$$" },
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
  { id: 16, name: "Ecluse Wines", region: "Willow Creek", rating: 4.6, reviews: 298, price: "$$$" },
  { id: 17, name: "Four Lanterns Winery", region: "Willow Creek", rating: 4.5, reviews: 189, price: "$$" },
  { id: 18, name: "Croad Vineyards", region: "Willow Creek", rating: 4.6, reviews: 231, price: "$$$" },
  { id: 19, name: "Justin Vineyards", region: "West Paso Robles", rating: 4.8, reviews: 983, price: "$$$" },
  { id: 20, name: "Booker Vineyard", region: "West Paso Robles", rating: 4.8, reviews: 389, price: "$$$$" },
  { id: 21, name: "Austin Hope Winery", region: "Templeton Gap", rating: 4.7, reviews: 856, price: "$$$" },
  { id: 22, name: "Castoro Cellars", region: "Templeton Gap", rating: 4.5, reviews: 567, price: "$$" },
  { id: 23, name: "J Dusi Wines", region: "Templeton Gap", rating: 4.6, reviews: 345, price: "$$" },
  { id: 24, name: "Bella Luna Estate", region: "Templeton Gap", rating: 4.5, reviews: 234, price: "$$" },
  { id: 25, name: "Cass Winery", region: "Templeton Gap", rating: 4.6, reviews: 423, price: "$$$" },
  { id: 26, name: "Giornata Wines", region: "Tin City", rating: 4.8, reviews: 312, price: "$$$" },
  { id: 27, name: "Sans Liege Wines", region: "Tin City", rating: 4.7, reviews: 287, price: "$$" },
  { id: 28, name: "ONX Wines", region: "Tin City", rating: 4.7, reviews: 256, price: "$$$" },
  { id: 29, name: "Turtle Rock Vineyards", region: "Tin City", rating: 4.6, reviews: 198, price: "$$" },
  { id: 30, name: "MCV Wines", region: "Tin City", rating: 4.5, reviews: 176, price: "$$" },
  { id: 31, name: "Cloak & Dagger Wines", region: "Tin City", rating: 4.6, reviews: 213, price: "$$" },
  { id: 32, name: "LXV Wine", region: "Downtown Paso Robles", rating: 4.8, reviews: 534, price: "$$$" },
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
  { id: 70, name: "Tobin James Cellars", region: "Paso Robles", rating: 4.7, reviews: 1567, price: "$$" },
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

export const TRAILS = [
  { id: 1, name: "Downtown Paso Trail", stops: [32, 33, 34, 35, 36, 86] },
  { id: 2, name: "Highway 46 West Trail", stops: [71, 74, 75, 7, 67, 22] },
  { id: 3, name: "Highway 46 East Trail", stops: [69, 63, 62, 70, 84] },
  { id: 4, name: "Adelaida Back Roads", stops: [1, 4, 3, 2, 5, 11] },
  { id: 5, name: "Tin City Trail", stops: [26, 27, 28, 29, 79, 80] },
  { id: 6, name: "Dog-Friendly Trail", stops: [2, 7, 22, 19, 17, 26] },
];

// Deterministic demo data generator — same seed = same output
export function generateDemoData(wineryId) {
  const now = new Date();
  const daily = [];
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, visitors: 0 }));
  const seed = wineryId * 137;

  for (let d = 89; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dow = date.getDay();
    const isWknd = dow === 0 || dow === 6;
    const base = isWknd ? 18 + (seed % 7) * 3 : 8 + (seed % 5) * 2;
    const season = (date.getMonth() >= 4 && date.getMonth() <= 9) ? 1.4 : 1;
    const rng = Math.abs(Math.sin(seed + d * 7.3)) * 12;
    const visitors = Math.round((base + rng) * season);
    const checkIns = Math.round(visitors * (0.25 + Math.abs(Math.sin(seed + d)) * 0.2));
    daily.push({
      date: date.toISOString().split("T")[0],
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      visitors,
      checkIns,
      avgRating: +(4.2 + Math.abs(Math.sin(seed + d * 3)) * 0.7).toFixed(1),
    });
  }

  const hourWeights = [0,0,0,0,0,0,0,0,1,3,6,10,14,16,15,12,9,6,3,1,0,0,0,0];
  const totalW = hourWeights.reduce((a, b) => a + b, 0);
  const todayV = daily[daily.length - 1].visitors;
  hourWeights.forEach((w, i) => { hourly[i].visitors = Math.round((w / totalW) * todayV * 3); });

  const sources = [
    { name: "Sip805 App", value: 42, color: "#9333ea" },
    { name: "Google Maps", value: 25, color: "#3b82f6" },
    { name: "Walk-in", value: 18, color: "#16a34a" },
    { name: "Trail Route", value: 15, color: "#f59e0b" },
  ];

  const ratings = [
    { stars: "5 stars", count: 52, color: "#16a34a" },
    { stars: "4 stars", count: 33, color: "#84cc16" },
    { stars: "3 stars", count: 10, color: "#f59e0b" },
    { stars: "2 stars", count: 4, color: "#f97316" },
    { stars: "1 star", count: 1, color: "#ef4444" },
  ];

  const last30 = daily.slice(-30);
  const prev30 = daily.slice(-60, -30);
  const v30 = last30.reduce((s, d) => s + d.visitors, 0);
  const vp30 = prev30.reduce((s, d) => s + d.visitors, 0);
  const c30 = last30.reduce((s, d) => s + d.checkIns, 0);
  const cp30 = prev30.reduce((s, d) => s + d.checkIns, 0);
  const ar30 = +(last30.reduce((s, d) => s + d.avgRating, 0) / 30).toFixed(1);

  return {
    daily, hourly, sources, ratings,
    kpi: {
      visitors: { value: v30, change: vp30 ? +((v30 - vp30) / vp30 * 100).toFixed(1) : 0 },
      checkIns: { value: c30, change: cp30 ? +((c30 - cp30) / cp30 * 100).toFixed(1) : 0 },
      avgRating: { value: ar30, change: +((Math.abs(Math.sin(seed)) * 0.4 - 0.1)).toFixed(1) },
      trailAppearances: { value: TRAILS.filter(t => t.stops.includes(wineryId)).length, change: 0 },
    },
  };
}
