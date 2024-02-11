class Record {
  title: string;
  lng: number;
  lat: number;

  constructor(title: string, lng: number, lat: number) {
    this.title = title;
    this.lng = lng;
    this.lat = lat;
  }
}

export default Record;
