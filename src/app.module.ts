import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Event } from './entities/event.entity';
import { Organizer } from './entities/organizer.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'myDb.db',
      entities: [Event, Organizer],
      synchronize: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([Event, Organizer]),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
