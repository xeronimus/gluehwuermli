import {msg} from '@lingui/core/macro';

import logger from '@/data/service/Logger';
import {fixtureService} from '@/data/service/services';

import {useAppStore} from '../store';
import {capShownChannelValues} from './capShownChannelValues';

export function useActionLoadFixtures() {
  const setFixtureSetup = useAppStore((state) => state.setFixtureSetup);

  return async () => {
    setFixtureSetup({type: 'loading'});
    try {
      const setup = await fixtureService.load();
      setFixtureSetup({type: 'loaded', setup});
      capShownChannelValues();
    } catch (error) {
      logger.error('loading the fixtures failed', error);
      setFixtureSetup({type: 'failed', message: msg`Could not load the fixtures`});
    }
  };
}
