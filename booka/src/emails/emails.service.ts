import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Email service
 * Handles sending emails for booking confirmations, cancellations, and welcome messages
 */
@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private resend: Resend;

  /**
   * Create email service
   * @param configService - Configuration service
   */
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not set. Email sending will fail.');
    }
    this.resend = new Resend(apiKey);
  }

  /**
   * Send email with retry logic
   * @param options - Email options
   * @param retries - Number of retries (default: 3)
   */
  private async sendEmailWithRetry(
    options: {
      to: string;
      subject: string;
      html: string;
      text?: string;
    },
    retries = 3,
  ): Promise<void> {
    const fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@booka.com';
    const fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Booka';

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        });

        this.logger.log(`Email sent successfully to ${options.to}`);
        return;
      } catch (error) {
        this.logger.error(`Failed to send email (attempt ${attempt}/${retries}): ${error}`);

        if (attempt === retries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Send booking confirmation email
   * @param email - Recipient email
   * @param bookingData - Booking information
   */
  async sendConfirmationEmail(
    email: string,
    bookingData: {
      bookingId: number;
      roomName: string;
      checkInDate: string;
      checkOutDate: string;
      totalPrice: string;
    },
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Booking Confirmation</h1>
            <p>Thank you for your booking! Your reservation has been confirmed.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #2c3e50;">Booking Details</h2>
              <p><strong>Booking ID:</strong> #${bookingData.bookingId}</p>
              <p><strong>Room:</strong> ${bookingData.roomName}</p>
              <p><strong>Check-in:</strong> ${bookingData.checkInDate}</p>
              <p><strong>Check-out:</strong> ${bookingData.checkOutDate}</p>
              <p><strong>Total Price:</strong> $${bookingData.totalPrice}</p>
            </div>
            
            <p>We look forward to hosting you!</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmailWithRetry({
      to: email,
      subject: `Booking Confirmation - ${bookingData.roomName}`,
      html,
    });
  }

  /**
   * Send booking cancellation email
   * @param email - Recipient email
   * @param bookingData - Booking information
   */
  async sendCancellationEmail(
    email: string,
    bookingData: {
      bookingId: number;
      roomName: string;
      checkInDate: string;
      checkOutDate: string;
      cancellationReason?: string;
    },
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Cancelled</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e74c3c;">Booking Cancelled</h1>
            <p>Your booking has been cancelled.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #2c3e50;">Cancelled Booking Details</h2>
              <p><strong>Booking ID:</strong> #${bookingData.bookingId}</p>
              <p><strong>Room:</strong> ${bookingData.roomName}</p>
              <p><strong>Check-in:</strong> ${bookingData.checkInDate}</p>
              <p><strong>Check-out:</strong> ${bookingData.checkOutDate}</p>
              ${bookingData.cancellationReason ? `<p><strong>Reason:</strong> ${bookingData.cancellationReason}</p>` : ''}
            </div>
            
            <p>If you have any questions about this cancellation, please contact us.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmailWithRetry({
      to: email,
      subject: `Booking Cancelled - ${bookingData.roomName}`,
      html,
    });
  }

  /**
   * Send welcome email to new user
   * @param email - Recipient email
   * @param name - User name
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Booka</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Welcome to Booka, ${name}!</h1>
            <p>Thank you for joining Booka. We're excited to help you find the perfect room for your next stay.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Search for available rooms</li>
              <li>Book your favorite accommodations</li>
              <li>Manage your bookings</li>
            </ul>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmailWithRetry({
      to: email,
      subject: 'Welcome to Booka!',
      html,
    });
  }
}
