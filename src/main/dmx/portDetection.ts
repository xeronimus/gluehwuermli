/** the FTDI FT245/FT232 USB ids the Enttec DMX USB Pro reports (it doesn't have ids of its own) */
const FTDI_VENDOR_ID = '0403';
const FTDI_FT232_PRODUCT_ID = '6001';

export interface UsbIds {
  vendorId?: string;
  productId?: string;
}

/** a hint only: other FTDI adapters have the same ids, the user picks the port */
export const isLikelyEnttecPro = ({vendorId, productId}: UsbIds): boolean =>
  vendorId?.toLowerCase() === FTDI_VENDOR_ID && productId?.toLowerCase() === FTDI_FT232_PRODUCT_ID;
