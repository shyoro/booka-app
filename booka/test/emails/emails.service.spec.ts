import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailsService } from '../../src/emails/emails.service';
import { Resend } from 'resend';

describe('EmailsService', () => {
  let service: EmailsService;
  let configService: ConfigService;
  let mockResend: any;

  beforeEach(() => {
    mockResend = {
      emails: {
        send: vi.fn(),
      },
    };

    vi.spyOn(Resend.prototype, 'constructor' as any).mockImplementation(() => {});

    const module = Test.createTestingModule({
      providers: [
        EmailsService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              const config: Record<string, string> = {
                RESEND_API_KEY: 'test-api-key',
                EMAIL_FROM: 'test@example.com',
                EMAIL_FROM_NAME: 'Test Booka',
              };
              return config[key];
            }),
          },
        },
      ],
    });

    service = new EmailsService({
      get: vi.fn((key: string) => {
        const config: Record<string, string> = {
          RESEND_API_KEY: 'test-api-key',
          EMAIL_FROM: 'test@example.com',
          EMAIL_FROM_NAME: 'Test Booka',
        };
        return config[key];
      }),
    } as any);

    // Mock the resend instance
    (service as any).resend = mockResend;
  });

  describe('sendConfirmationEmail', () => {
    it('should send confirmation email successfully', async () => {
      const email = 'user@example.com';
      const bookingData = {
        bookingId: 1,
        roomName: 'Test Room',
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
        totalPrice: '500.00',
      };

      mockResend.emails.send.mockResolvedValue({ id: 'email-id' });

      await service.sendConfirmationEmail(email, bookingData);

      expect(mockResend.emails.send).toHaveBeenCalled();
      const callArgs = mockResend.emails.send.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toContain(bookingData.roomName);
      expect(callArgs.html).toContain(bookingData.bookingId.toString());
    });

    it('should retry on failure', async () => {
      const email = 'user@example.com';
      const bookingData = {
        bookingId: 1,
        roomName: 'Test Room',
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
        totalPrice: '500.00',
      };

      mockResend.emails.send
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ id: 'email-id' });

      await service.sendConfirmationEmail(email, bookingData);

      expect(mockResend.emails.send).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const email = 'user@example.com';
      const bookingData = {
        bookingId: 1,
        roomName: 'Test Room',
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
        totalPrice: '500.00',
      };

      mockResend.emails.send.mockRejectedValue(new Error('Persistent error'));

      await expect(service.sendConfirmationEmail(email, bookingData)).rejects.toThrow();
      expect(mockResend.emails.send).toHaveBeenCalledTimes(3);
    });
  });

  describe('sendCancellationEmail', () => {
    it('should send cancellation email successfully', async () => {
      const email = 'user@example.com';
      const bookingData = {
        bookingId: 1,
        roomName: 'Test Room',
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
        cancellationReason: 'Change of plans',
      };

      mockResend.emails.send.mockResolvedValue({ id: 'email-id' });

      await service.sendCancellationEmail(email, bookingData);

      expect(mockResend.emails.send).toHaveBeenCalled();
      const callArgs = mockResend.emails.send.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toContain('Cancelled');
      expect(callArgs.html).toContain(bookingData.bookingId.toString());
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const email = 'newuser@example.com';
      const name = 'New User';

      mockResend.emails.send.mockResolvedValue({ id: 'email-id' });

      await service.sendWelcomeEmail(email, name);

      expect(mockResend.emails.send).toHaveBeenCalled();
      const callArgs = mockResend.emails.send.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toContain('Welcome');
      expect(callArgs.html).toContain(name);
    });
  });
});

