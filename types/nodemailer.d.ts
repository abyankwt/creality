declare module "nodemailer" {
  export type TransportOptions = {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  export type SendMailOptions = {
    from: string;
    to: string;
    replyTo?: string;
    subject: string;
    text: string;
    html?: string;
  };

  export type Transporter = {
    sendMail(mail: SendMailOptions): Promise<unknown>;
  };

  const nodemailer: {
    createTransport(options: TransportOptions): Transporter;
  };

  export default nodemailer;
}
