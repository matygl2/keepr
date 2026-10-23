-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'Keepr Free',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '📦',
    "store" TEXT NOT NULL,
    "purchaseDate" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "warrantyExpiryDate" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL DEFAULT 'N/A',
    "documentation" JSONB NOT NULL,
    "calendarEventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT '',
    "cost" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    CONSTRAINT "MaintenanceEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "Product"("userId");

-- CreateIndex
CREATE INDEX "MaintenanceEntry_productId_idx" ON "MaintenanceEntry"("productId");
