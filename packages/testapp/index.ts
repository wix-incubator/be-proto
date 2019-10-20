import {builder} from '@wix/be-server';
import {Echo} from './be-client/test/TypesService.Echo';
import {AllTypes} from './be-client/test/AllTypes';

builder()
  .withBindings(
    Echo.bind((echo: AllTypes) => Promise.resolve(echo))
  )
  .start();
