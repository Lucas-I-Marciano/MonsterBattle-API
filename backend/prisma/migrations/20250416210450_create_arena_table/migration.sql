-- CreateTable
CREATE TABLE "Arena" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "max_players" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Arena_name_key" ON "Arena"("name");
