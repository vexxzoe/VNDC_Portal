/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `App` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "App_url_key" ON "App"("url");
