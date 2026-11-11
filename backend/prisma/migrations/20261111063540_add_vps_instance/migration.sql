-- CreateTable
CREATE TABLE "VPSInstance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SMARTVPS',
    "providerVpsId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "hostname" TEXT,
    "operatingSystem" TEXT,
    "ram" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VPSInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VPSInstance_providerVpsId_key" ON "VPSInstance"("providerVpsId");

-- CreateIndex
CREATE UNIQUE INDEX "VPSInstance_ipAddress_key" ON "VPSInstance"("ipAddress");

-- CreateIndex
CREATE INDEX "VPSInstance_userId_idx" ON "VPSInstance"("userId");

-- CreateIndex
CREATE INDEX "VPSInstance_status_idx" ON "VPSInstance"("status");

-- AddForeignKey
ALTER TABLE "VPSInstance" ADD CONSTRAINT "VPSInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
