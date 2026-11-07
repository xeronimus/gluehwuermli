/** A fader on the desk, controlling one DMX channel. */
export default interface Fader {
  readonly channel: number;
  readonly label: string;
  /** `#rrggbb`: the fader fills and glows in it with the value; a fixture channel's, never a raw channel's */
  readonly color?: string;
}
