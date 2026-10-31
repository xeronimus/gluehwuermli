/** A fader on the desk, controlling one DMX channel. */
export default interface Fader {
  readonly channel: number;
  readonly label: string;
}
