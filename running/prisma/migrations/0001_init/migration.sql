CREATE TABLE "run_pace" (
  "id" BIGSERIAL NOT NULL,
  "distance_type" TEXT NOT NULL,
  "distance_km" DECIMAL(8,4) NOT NULL,
  "target_seconds" INTEGER NOT NULL,
  "pace_seconds_per_km" INTEGER NOT NULL,
  "target_time" TEXT NOT NULL,
  "pace_text" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "run_pace_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "run_pace_distance_type_created_at_idx" ON "run_pace"("distance_type", "created_at");

CREATE TABLE "marathon_event" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "region" TEXT,
  "address" TEXT,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "race_date" DATE,
  "start_time" TEXT,
  "registration_start_date" DATE,
  "registration_end_date" DATE,
  "registration_status" TEXT,
  "distance_10k" BOOLEAN NOT NULL DEFAULT false,
  "distance_half" BOOLEAN NOT NULL DEFAULT false,
  "distance_full" BOOLEAN NOT NULL DEFAULT false,
  "entry_fee" TEXT,
  "organizer" TEXT,
  "host" TEXT,
  "website_url" TEXT,
  "registration_url" TEXT,
  "description" TEXT,
  "image_url" TEXT,
  "source_name" TEXT,
  "source_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marathon_event_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "marathon_event_race_date_idx" ON "marathon_event"("race_date");
CREATE INDEX "marathon_event_region_idx" ON "marathon_event"("region");
CREATE INDEX "marathon_event_registration_status_idx" ON "marathon_event"("registration_status");
ALTER TABLE "marathon_event" ADD COLUMN "source_key" TEXT;
CREATE UNIQUE INDEX "marathon_event_source_key_key" ON "marathon_event"("source_key");

CREATE TABLE "baby_checklist" (
  "id" BIGSERIAL NOT NULL,
  "type" TEXT NOT NULL,
  "period_type" TEXT NOT NULL DEFAULT 'week',
  "week_from" INTEGER NOT NULL,
  "week_to" INTEGER NOT NULL,
  "month_from" INTEGER,
  "month_to" INTEGER,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "source_name" TEXT,
  "source_url" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "mandatory" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "baby_checklist_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "baby_checklist_type_week_from_week_to_active_idx" ON "baby_checklist"("type", "week_from", "week_to", "active");
ALTER TABLE "baby_checklist" ALTER COLUMN "week_from" DROP NOT NULL;
ALTER TABLE "baby_checklist" ALTER COLUMN "week_to" DROP NOT NULL;

CREATE TABLE "baby_benefit" (
  "id" BIGSERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "region_sido" TEXT,
  "region_sigungu" TEXT,
  "content" TEXT,
  "amount" TEXT,
  "target" TEXT,
  "apply_method" TEXT,
  "agency" TEXT,
  "official_url" TEXT,
  "source_name" TEXT,
  "effective_date" DATE,
  "updated_source_at" DATE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "baby_benefit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "baby_benefit_region_sido_region_sigungu_idx" ON "baby_benefit"("region_sido", "region_sigungu");
