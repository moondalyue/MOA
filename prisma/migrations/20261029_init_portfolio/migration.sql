BEGIN;

CREATE TYPE public."ActivityCategory"
AS ENUM ('SCHOOL', 'CHURCH', 'VOLUNTEER');

CREATE TYPE public."ActivityVisibility"
AS ENUM ('PRIVATE', 'PUBLIC');

CREATE TABLE public.users (
    "id" UUID NOT NULL,
    "authUserId" UUID,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "nickname" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT users_pkey PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_authUserId_key"
ON public.users ("authUserId");

CREATE UNIQUE INDEX users_email_key
ON public.users ("email");

CREATE TABLE public.activities (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "category" public."ActivityCategory" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "organization" VARCHAR(100) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "role" VARCHAR(100),
    "volunteerHours" DECIMAL(8, 2),
    "location" VARCHAR(200),
    "description" VARCHAR(2000) NOT NULL,
    "achievement" VARCHAR(2000),
    "learning" VARCHAR(2000) NOT NULL,
    "visibility" public."ActivityVisibility"
        NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMPTZ(3)
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT activities_pkey PRIMARY KEY ("id"),

    CONSTRAINT "activities_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES public.users ("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX "activities_userId_createdAt_id_idx"
ON public.activities ("userId", "createdAt", "id");

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    public.users,
    public.activities,
    public._prisma_migrations
FROM PUBLIC, anon, authenticated;

COMMIT;
