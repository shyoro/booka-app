DO $$ BEGIN
 ALTER TABLE "bookings" DROP CONSTRAINT "booking_dates_unique";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text NOT NULL;