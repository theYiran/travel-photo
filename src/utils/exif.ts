import ExifReader from 'exifreader';
import { Photo } from '../types';

export const extractMetadata = async (file: File): Promise<Partial<Photo>> => {
  try {
    const tags = await ExifReader.load(file);
    
    let lat = null;
    let lng = null;
    let timestamp = file.lastModified;

    if (tags['GPSLatitude'] && tags['GPSLongitude']) {
      lat = tags['GPSLatitude'].description as any;
      lng = tags['GPSLongitude'].description as any;
      
      // ExifReader often returns decimal description directly
      if (typeof lat === 'string') lat = parseFloat(lat);
      if (typeof lng === 'string') lng = parseFloat(lng);
    }

    if (tags['DateTimeOriginal']) {
      const dateStr = tags['DateTimeOriginal'].description;
      // Format: "YYYY:MM:DD HH:MM:SS"
      const parts = dateStr.split(/[: ]/);
      const date = new Date(
        parseInt(parts[0]), 
        parseInt(parts[1]) - 1, 
        parseInt(parts[2]), 
        parseInt(parts[3]), 
        parseInt(parts[4]), 
        parseInt(parts[5])
      );
      timestamp = date.getTime();
    }

    return {
      lat,
      lng,
      timestamp,
      name: file.name
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      lat: null,
      lng: null,
      timestamp: file.lastModified,
      name: file.name
    };
  }
};
