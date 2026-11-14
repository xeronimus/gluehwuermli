import {tempoService} from '@/data/service/services';

/** one tap, fire-and-forget: main timestamps it and pushes a new tempo. One function, so a key listener keeps it */
const tapTempo = () => tempoService.tap();

/** the tap pad and the T key */
export function useActionTapTempo() {
  return tapTempo;
}
