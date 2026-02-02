export class NotificationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NotificationError";
  }
}

export class ChannelError extends NotificationError {
  readonly channel: string;

  constructor(channel: string, message: string, options?: ErrorOptions) {
    super(`[${channel}] ${message}`, options);
    this.name = "ChannelError";
    this.channel = channel;
  }
}

export class DeliveryError extends NotificationError {
  readonly deliveryId: string;

  constructor(deliveryId: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DeliveryError";
    this.deliveryId = deliveryId;
  }
}
