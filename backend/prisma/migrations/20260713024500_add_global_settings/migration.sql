-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" TEXT NOT NULL DEFAULT '1',
    "asaasApiKey" TEXT NOT NULL DEFAULT '',
    "stripeSecretKey" TEXT NOT NULL DEFAULT '',
    "platformName" TEXT NOT NULL DEFAULT 'Hosped',
    "supportEmail" TEXT NOT NULL DEFAULT 'suporte@hosped.com',
    "helpCenterUrl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "GlobalSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GlobalSettings_singleton" CHECK (id = '1')
);
