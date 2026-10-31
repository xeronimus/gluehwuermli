import log from 'loglevel';

import envConfig from '@/envConfig';

if (envConfig.debug) {
  log.setLevel('debug');
} else {
  log.setLevel('warn');
}

export default log;
