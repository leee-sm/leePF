export type GridCoordinate = {
  nx: number;
  ny: number;
};

const EARTH_RADIUS_KM = 6371.00877;
const GRID_SIZE_KM = 5.0;
const STANDARD_LATITUDE_1 = 30.0;
const STANDARD_LATITUDE_2 = 60.0;
const ORIGIN_LONGITUDE = 126.0;
const ORIGIN_LATITUDE = 38.0;
const ORIGIN_X = 43.0;
const ORIGIN_Y = 136.0;

export function convertLatLonToGrid(
  latitude: number,
  longitude: number,
): GridCoordinate {
  const degrad = Math.PI / 180.0;
  const re = EARTH_RADIUS_KM / GRID_SIZE_KM;
  const slat1 = STANDARD_LATITUDE_1 * degrad;
  const slat2 = STANDARD_LATITUDE_2 * degrad;
  const olon = ORIGIN_LONGITUDE * degrad;
  const olat = ORIGIN_LATITUDE * degrad;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;

  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + latitude * degrad * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);

  let theta = longitude * degrad - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + ORIGIN_X + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + ORIGIN_Y + 0.5),
  };
}
