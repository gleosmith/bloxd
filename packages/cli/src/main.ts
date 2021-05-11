import { AppModule } from './app.module';
import { createCli } from '../../lib/src';

createCli(AppModule).execute();
