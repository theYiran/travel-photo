export interface Photo {
  id: string;
  url: string;
  name: string;
  lat: number | null;
  lng: number | null;
  timestamp: number;
  address?: string;
}

export interface MapState {
  center: [number, number];
  zoom: number;
}
