export const WMS_URL = "https://ahocevar.com/geoserver/wms";
export const WFS_URL = "https://ahocevar.com/geoserver/wfs";
export const DEFAULT_LAYER = "topp:states";
export function legendUrl(layer) {
  return `${WMS_URL}?service=WMS&version=1.1.1&request=GetLegendGraphic&format=image/png&layer=${encodeURIComponent(layer)}`;
}
