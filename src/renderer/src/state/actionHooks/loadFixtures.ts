import logger from '@/data/service/Logger';
import {fixtureService} from '@/data/service/services';

import {useAppStore} from '../store';
import {capShownChannelValues} from './capShownChannelValues';

export function useActionLoadFixtures() {
  const setFixtureSetup = useAppStore((state) => state.setFixtureSetup);

  return async () => {
    setFixtureSetup({type: 'loading'});
    try {
      const {fixtures} = await fixtureService.load();
      setFixtureSetup({type: 'loaded', fixtures});
      capShownChannelValues();
    } catch (error) {
      logger.error('loading the fixtures failed', error);
      setFixtureSetup({type: 'failed', message: 'Could not load the fixtures'});
    }
  };
}
