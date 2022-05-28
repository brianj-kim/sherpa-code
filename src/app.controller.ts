import { Controller, Get, Param, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from './app.service';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Event } from './entities/event.entity';
import { EventDetail } from './interfaces';

const dateValidator = (dy: string) => {
  if (dy === undefined) return false;
  if (
    dy.match('\\d{4}-\\d{2}-\\d{2}') &&
    new Date(dy).getTime() >= new Date().getTime()
  ) {
    return true;
  }

  return false;
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('update')
  async getPatch(): Promise<any> {
    return await this.appService.seed();
  }

  @Get('events/:id')
  findOne(@Param() params): Observable<EventDetail> {
    return this.appService.findOne(params.id);
  }

  @Get('events')
  index(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('from') since: string,
    @Query('until') until: string,
  ): Observable<Pagination<Event>> {
    limit = limit > 100 ? 100 : limit;

    if (dateValidator(until)) {
      const newUntil: number = new Date(until).getTime();
      return this.appService.paginateWithUntil(
        {
          page: Number(page),
          limit: Number(limit),
          route: 'http://localhost:3000/events',
        },
        { newUntil },
      );
    }

    if (dateValidator(since)) {
      const newSince: number = new Date(since).getTime();
      return this.appService.paginateWithFrom(
        {
          page: Number(page),
          limit: Number(limit),
          route: 'http://localhost:3000/events',
        },
        { newSince },
      );
    }

    return this.appService.paginate({
      page: Number(page),
      limit: Number(limit),
      route: 'http://localhost:3000/events',
    });
  }
}
