import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { Organizer } from './entities/organizer.entity';
import JsonData from './data.json';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { map, from, Observable } from 'rxjs';
import {
  paginate,
  IPaginationOptions,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { EventDetail } from './interfaces';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';

// get unique organizer object array
const getUniqueOrgz = (arr: Organizer[]) => {
  return [...new Map(arr.map((item) => [item['name'], item])).values()];
};

// Checks if the event day is within 7 days
const isWithin7Days = (dy: number) => {
  const now = new Date();
  now.setDate(now.getDate() + 7);

  if (dy <= new Date(now).getTime()) return true;

  return false;
};

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Organizer) private organizerRepo: Repository<Organizer>,
    private readonly httpService: HttpService,
  ) {}

  async seed() {
    // Patch organizer with an unique organizer array
    const orgzs: Organizer[] = [];

    JsonData.forEach(async (item) => {
      const orgz = new Organizer();
      orgz.name = item.organizer.name;
      orgzs.push(orgz);
    });

    const uniqueOrgz = getUniqueOrgz(orgzs);

    uniqueOrgz.forEach(async (item) => {
      const existOrgz = await this.organizerRepo.find({ where: item });
      if (existOrgz.length === 0) {
        await this.organizerRepo.save(item);
      }
    });

    // Patch events
    JsonData.forEach(async (item) => {
      // prepare organizer for the event
      let orgz = new Organizer();
      orgz = await this.organizerRepo.findOne({
        where: { name: item.organizer.name },
      });
      const newEvent = new Event();
      newEvent.name = item.name;
      newEvent.isOutside = item.isOutside;
      newEvent.location = item.location;
      newEvent.date = item.date;
      newEvent.organizer = orgz;

      await this.eventRepo.save(newEvent);
    });
  }

  // Get One Event
  findOne(id: number): Observable<EventDetail> {
    return from(
      this.eventRepo.findOne({
        relations: ['organizer'],
        where: { id: id },
      }),
    ).pipe(
      map((event: Event) => {
        // Check the event is within 7 days
        const newEvent: EventDetail = {
          id: event.id,
          name: event.name,
          date: event.date,
          isOutside: event.isOutside,
          attendees: event.attendees,
          organiger: event.organizer,
          weather: null,
        };

        // If the event is within 7 days from now and the event is for outside,
        // bring weatehr forecase information is to be needed
        if (isWithin7Days(event.date) && event.isOutside) {
          const newWeather = {
            temperatureInDegreesCelcius: null,
            chanceOfRain: null,
          };

          newEvent.weather = newWeather;
          const data = this.getWeatherForecasts(event.location);

          // console.log(data);
          // I tried and searched why the data results Observable
          // I could not figure it out.
        }
        return newEvent;
      }),
    );
  }

  // Pagination
  paginate(options: IPaginationOptions): Observable<Pagination<Event>> {
    return from(paginate<Event>(this.eventRepo, options)).pipe(
      map((eventsPageable: Pagination<Event>) => {
        return eventsPageable;
      }),
    );
  }

  paginateWithFrom(
    options: IPaginationOptions,
    since: any,
  ): Observable<Pagination<Event>> {
    return from(
      this.eventRepo.findAndCount({
        skip: 0,
        take: Number(options.limit) || 10,
        where: [{ date: MoreThan(since.newSince) }],
      }),
    ).pipe(
      map(([events, totalEvents]) => {
        const eventsPageable: Pagination<Event> = {
          items: events,
          links: {
            first: options.route + `?limit=${options.limit}`,
            previous: options.route + ``,
            next:
              options.route +
              `?limit=${options.limit}&page=${Number(options.page) + 1}`,
            last:
              options.route +
              `?limit=${options.limit}&page=${
                Number(totalEvents) / Number(options.page)
              }`,
          },
          meta: {
            currentPage: Number(options.page),
            itemCount: Number(events.length),
            itemsPerPage: Number(options.limit),
            totalItems: Number(totalEvents),
            totalPages: Math.ceil(totalEvents / Number(options.limit)),
          },
        };

        return eventsPageable;
      }),
    );
  }

  paginateWithUntil(
    options: IPaginationOptions,
    until: any,
  ): Observable<Pagination<Event>> {
    return from(
      this.eventRepo.findAndCount({
        skip: 0,
        take: Number(options.limit) || 10,
        where: [{ date: LessThan(until.newUntil) }],
      }),
    ).pipe(
      map(([events, totalEvents]) => {
        const eventsPageable: Pagination<Event> = {
          items: events,
          links: {
            first: options.route + `?limit=${options.limit}`,
            previous: options.route + ``,
            next:
              options.route +
              `?limit=${options.limit}&page=${Number(options.page) + 1}`,
            last:
              options.route +
              `?limit=${options.limit}&page=${
                Number(totalEvents) / Number(options.page)
              }`,
          },
          meta: {
            currentPage: Number(options.page),
            itemCount: Number(events.length),
            itemsPerPage: Number(options.limit),
            totalItems: Number(totalEvents),
            totalPages: Math.ceil(totalEvents / Number(options.limit)),
          },
        };

        return eventsPageable;
      }),
    );
  }

  getWeatherForecasts(location: string): Observable<AxiosResponse<any>> {
    const city = location.split('|');
    let cty = city[1];
    cty = cty.toLowerCase();
    cty = cty.charAt(0).toUpperCase() + cty.slice(1);
    const api = `http://api.weatherapi.com/v1/forecast.json?key=63c0e5bc0b454f24a1d144334222705&q=${cty}&days=7&aqi=no&alerts=no`;

    return this.httpService.get(api).pipe(
      map((res: AxiosResponse) => {
        return res.data;
      }),
    );
  }
}
