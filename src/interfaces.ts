import { Organizer } from './entities/organizer.entity';

export interface Weather {
  temperatureInDegreesCelcius: number;
  chanceOfRain: number;
}

export interface NewEvent {
  name: string;
  isOutside: boolean;
  location: string;
  date: number;
  organiger: Organizer;
}

export interface EventDetail {
  id: number;
  name: string;
  date: number;
  isOutside: boolean;
  attendees: string;
  organiger: Organizer;
  weather: any;
}
