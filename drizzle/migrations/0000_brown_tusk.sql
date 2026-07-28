CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reason_for_visit` text,
	`queue_position` integer,
	`checked_in_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`symptoms` text,
	`diagnosis` text,
	`notes` text,
	`vitals` text,
	`is_signed` integer DEFAULT false NOT NULL,
	`signed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `doctor_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`slot_duration_minutes` integer DEFAULT 20 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `doctors` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`specialty` text NOT NULL,
	`license_number` text,
	`bio` text,
	`consultation_fee` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`appointment_id` text,
	`items` text NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `medical_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`consultation_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`attachment_url` text,
	`is_signed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`national_id` text,
	`date_of_birth` integer,
	`gender` text,
	`blood_type` text,
	`allergies` text,
	`chronic_conditions` text,
	`emergency_contact_name` text,
	`emergency_contact_phone` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount` real NOT NULL,
	`method` text NOT NULL,
	`received_by_user_id` text NOT NULL,
	`paid_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`consultation_id` text NOT NULL,
	`medications` text NOT NULL,
	`instructions` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`password_hash` text,
	`role` text NOT NULL,
	`avatar_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);