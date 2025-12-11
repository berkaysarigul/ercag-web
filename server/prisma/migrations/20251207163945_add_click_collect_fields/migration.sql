-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "fullName" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "note" TEXT,
    "pickupRequestedTime" TEXT,
    "pickupCode" TEXT,
    "pickupCodeExpiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statusHistory" TEXT NOT NULL DEFAULT '[]',
    "readyAt" DATETIME,
    "completedAt" DATETIME,
    "handledByUserId" INTEGER,
    "totalAmount" DECIMAL NOT NULL,
    "couponCode" TEXT,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("couponCode", "createdAt", "discountAmount", "id", "pickupCode", "status", "statusHistory", "totalAmount", "updatedAt", "userId") SELECT "couponCode", "createdAt", "discountAmount", "id", "pickupCode", "status", "statusHistory", "totalAmount", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_pickupCode_key" ON "Order"("pickupCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
